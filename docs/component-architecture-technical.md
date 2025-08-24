# Component Architecture and Technical Implementation

## Application Structure

```
App
├── AuthProvider (Supabase Auth integration)
├── Router
│   ├── PublicRoute
│   │   └── LoginPage
│   └── ProtectedRoute
│       ├── Layout
│       │   ├── Header 
│       │   │   ├── Logo
│       │   │   ├── UserProfile
│       │   │   └── ClinicSelector (director/super_admin only)
│       │   └── Main
│       │       └── PatientsTable (main page - unified table)
│       │           ├── FilterPanel
│       │           ├── SearchBar
│       │           ├── PatientCard (mobile version)
│       │           ├── PatientTableRow (desktop version)
│       │           ├── EditPatientModal (edit 4 fields)
│       │           └── FieldGroupToggles (show/hide field groups)
│       └── RealTimeProvider (change subscriptions)
└── ErrorBoundary
```

## Core Components

### 1. PatientsTable.tsx (Main Component)

```typescript
interface PatientsTableProps {
  userRole: 'coordinator' | 'director' | 'super_admin';
  userClinic?: string; // for coordinator - bound to one clinic
}

interface PatientsTableState {
  patients: PatientData[];
  filters: PatientFilters;
  visibleFieldGroups: FieldGroup[];
  loading: boolean;
  error: string | null;
  editingPatient: PatientData | null;
}

// Main component features:
// - Displays unified table of all patients (arriving + in treatment + departing)
// - Advance apartment preparation for arriving patients
// - Departure planning for patients completing treatment
// - Uses master_view from Supabase
// - Real-time subscription for changes
// - Responsive display: cards on mobile, table on desktop
```

**Key Functions**:
- Load patient data based on user role and clinic assignment
- Handle real-time updates via Supabase subscriptions
- Manage filter state and field group visibility
- Coordinate between table/card views and edit modal

### 2. FilterPanel.tsx

```typescript
interface FilterPanelProps {
  onFilterChange: (filters: PatientFilters) => void;
  availableClinics: string[]; // depends on user role
  currentFilters: PatientFilters;
  userRole: 'coordinator' | 'director' | 'super_admin';
}

interface PatientFilters {
  dateRange: 'today' | 'tomorrow' | 'week' | 'custom';
  status: 'arriving' | 'in_treatment' | 'departing' | 'all';
  clinic?: string; // for director/super_admin
  search?: string;
  urgentVisas?: boolean; // visas expiring soon
}
```

**Features**:
- Quick filter buttons for common date ranges
- Patient name search with debouncing
- Role-based clinic filtering
- Clear all filters functionality
- Persistent filter state in localStorage

### 3. PatientCard.tsx (Mobile Version)

```typescript
interface PatientCardProps {
  patient: PatientData;
  showEditableFields: boolean; // depends on role
  visibleFieldGroups: FieldGroup[];
  onFieldUpdate: (field: EditableField, value: string) => void;
  onEditClick: () => void;
}

type FieldGroup = 'basic' | 'arrival' | 'departure' | 'visa' | 'personal';
type EditableField = 'apartment_number' | 'departure_city' | 'departure_datetime' | 'departure_flight_number';
```

**Features**:
- Collapsible field groups for space efficiency
- Inline editing for coordinator-editable fields
- Color-coded visa status indicators
- Touch-friendly interaction design
- Swipe gestures for navigation

### 4. PatientTableRow.tsx (Desktop Version)

```typescript
interface PatientTableRowProps {
  patient: PatientData;
  showEditableFields: boolean;
  visibleFieldGroups: FieldGroup[];
  onFieldUpdate: (field: EditableField, value: string) => void;
  onEditClick: () => void;
}
```

**Features**:
- Displays only selected field groups
- Inline editing with validation
- Hover states for interactive elements
- Keyboard navigation support
- Optimistic updates with rollback

### 5. EditPatientModal.tsx

```typescript
interface EditPatientModalProps {
  patient: PatientData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFields: Partial<PatientData>) => void;
  readOnlyFields: string[]; // AMO CRM fields that cannot be edited
}

interface EditablePatientData {
  apartment_number?: string; // advance preparation
  departure_city?: string;
  departure_datetime?: string;
  departure_flight_number?: string;
}
```

**Features**:
- Modal form for editing 4 key fields
- Real-time validation with error display
- Date restrictions (not later than visa expiry)
- Autocomplete from cities directory
- Change preview before saving

### 6. FieldGroupToggles.tsx

```typescript
interface FieldGroupTogglesProps {
  availableGroups: FieldGroup[];
  visibleGroups: FieldGroup[];
  onToggle: (group: FieldGroup) => void;
  userRole: 'coordinator' | 'director' | 'super_admin';
}
```

**Features**:
- Toggle buttons for field group visibility
- Role-based available groups
- Preference persistence in localStorage
- Icons for visual identification

### 7. RealTimeProvider.tsx

```typescript
interface RealTimeContextType {
  isConnected: boolean;
  lastUpdate: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  subscribeToPatients: (callback: (data: PatientData) => void) => void;
  unsubscribeFromPatients: () => void;
}
```

**Features**:
- Manages Supabase real-time subscriptions
- Handles connection state and reconnection
- Broadcasts changes to consuming components
- Connection status display

## Data Types

### Core Patient Data Type

```typescript
interface PatientData {
  // Primary identifiers
  deal_id: number;
  patient_full_name: string;
  clinic_name: string;
  patient_status: 'Arriving' | 'In Treatment' | 'Departed';
  
  // Arrival data (read-only)
  arrival_datetime: string;
  arrival_transport_type: string;
  arrival_city: string;
  arrival_flight_number: string;
  arrival_terminal: string;
  passengers_count: string;
  
  // Editable fields
  apartment_number: string | null; // advance preparation
  departure_city: string | null;
  departure_datetime: string | null;
  departure_flight_number: string | null;
  
  // Visa data
  visa_type: string;
  visa_days: number;
  visa_expiry_date: string;
  visa_status: 'Active' | 'Expiring Soon' | 'Expired';
  days_until_visa_expires: number;
  
  // Personal data (super_admin only)
  patient_phone?: string;
  patient_email?: string;
  patient_country?: string;
  patient_passport?: string;
  
  // System data
  created_at: string;
  updated_at: string;
  amocrm_contact_id?: number;
}
```

### User Profile Type

```typescript
interface UserProfile {
  id: string;
  role: 'coordinator' | 'director' | 'super_admin';
  clinic_name?: string; // strict binding for coordinator, NULL for others
  full_name: string;
  phone?: string;
  is_active: boolean;
}
```

## State Management

### Context Structure

```typescript
// Auth Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Patients Context
interface PatientsContextType {
  patients: PatientData[];
  filters: PatientFilters;
  visibleFieldGroups: FieldGroup[];
  loading: boolean;
  error: string | null;
  updatePatient: (id: number, data: Partial<PatientData>) => Promise<void>;
  setFilters: (filters: PatientFilters) => void;
  toggleFieldGroup: (group: FieldGroup) => void;
}
```

## Database Operations

### Supabase Queries

```typescript
// Load patients based on user role
const loadPatients = async (userProfile: UserProfile, filters: PatientFilters) => {
  let query = supabase
    .from('super_admin_master_view')
    .select('*');
    
  // Role-based filtering
  if (userProfile.role === 'coordinator' && userProfile.clinic_name) {
    query = query.eq('clinic_name', userProfile.clinic_name);
  }
  
  // Apply filters
  if (filters.clinic && userProfile.role !== 'coordinator') {
    query = query.eq('clinic_name', filters.clinic);
  }
  
  if (filters.status !== 'all') {
    query = query.eq('patient_status', filters.status);
  }
  
  if (filters.search) {
    query = query.ilike('patient_full_name', `%${filters.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Update editable fields
const updatePatientFields = async (
  dealId: number, 
  updates: Partial<EditablePatientData>
) => {
  const { apartment_number, ...departureFields } = updates;
  
  // Update apartment in tickets_to_china
  if (apartment_number !== undefined) {
    const { error: arrivalError } = await supabase
      .from('tickets_to_china')
      .update({ apartment_number })
      .eq('deal_id', dealId);
    if (arrivalError) throw arrivalError;
  }
  
  // Update departure fields in tickets_from_treatment
  if (Object.keys(departureFields).length > 0) {
    const { error: departureError } = await supabase
      .from('tickets_from_treatment')
      .update(departureFields)
      .eq('deal_id', dealId);
    if (departureError) throw departureError;
  }
};
```

### Real-time Subscriptions

```typescript
// Subscribe to patient data changes
const subscribeToPatientChanges = (
  userProfile: UserProfile,
  callback: (payload: any) => void
) => {
  let channel = supabase.channel('patient_changes');
  
  // Subscribe to relevant table changes based on role
  if (userProfile.role === 'coordinator' && userProfile.clinic_name) {
    channel = channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets_to_china',
          filter: `clinic_name=eq.${userProfile.clinic_name}`
        },
        callback
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'tickets_from_treatment',
          filter: `clinic_name=eq.${userProfile.clinic_name}`
        },
        callback
      );
  } else {
    // Director and super_admin see all changes
    channel = channel
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets_to_china' },
        callback
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tickets_from_treatment' },
        callback
      );
  }
  
  return channel.subscribe();
};
```

## Error Handling

### Error Boundary Component

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    // Log to external service if configured
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              Please refresh the page or contact support if the problem persists.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Performance Optimizations

### Component Memoization

```typescript
// Memoize expensive patient card rendering
const PatientCard = React.memo<PatientCardProps>(({ patient, ...props }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for deep equality on patient data
  return (
    prevProps.patient.deal_id === nextProps.patient.deal_id &&
    prevProps.patient.updated_at === nextProps.patient.updated_at &&
    JSON.stringify(prevProps.visibleFieldGroups) === JSON.stringify(nextProps.visibleFieldGroups)
  );
});

// Memoize filter panel to prevent unnecessary re-renders
const FilterPanel = React.memo<FilterPanelProps>(FilterPanelComponent);
```

### Data Fetching Optimization

```typescript
// Implement debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Use in search functionality
const SearchBar = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search patients..."
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
    />
  );
};
```

## Implementation Details

### Supabase Configuration

```typescript
// supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export type Database = {
  public: {
    Tables: {
      super_admin_master_view: {
        Row: PatientData
      }
      user_profiles: {
        Row: UserProfile
      }
      // ... other table types
    }
  }
}
```

### Authentication Setup

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { user, profile, loading, signIn, signOut }
}
```

### Real-time Data Hook

```typescript
// hooks/usePatients.ts
export const usePatients = (userProfile: UserProfile) => {
  const [patients, setPatients] = useState<PatientData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPatients = useCallback(async (filters: PatientFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await loadPatientsFromDB(userProfile, filters)
      setPatients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients')
    } finally {
      setLoading(false)
    }
  }, [userProfile])

  useEffect(() => {
    // Subscribe to real-time changes
    const channel = subscribeToPatientChanges(userProfile, (payload) => {
      // Update local state based on database changes
      setPatients(current => {
        // Handle INSERT, UPDATE, DELETE operations
        switch (payload.eventType) {
          case 'INSERT':
            return [...current, payload.new]
          case 'UPDATE':
            return current.map(p => 
              p.deal_id === payload.new.deal_id ? payload.new : p
            )
          case 'DELETE':
            return current.filter(p => p.deal_id !== payload.old.deal_id)
          default:
            return current
        }
      })
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile])

  const updatePatient = async (dealId: number, updates: Partial<PatientData>) => {
    try {
      await updatePatientFields(dealId, updates)
      // Optimistic update
      setPatients(current =>
        current.map(p =>
          p.deal_id === dealId ? { ...p, ...updates } : p
        )
      )
    } catch (err) {
      setError('Failed to update patient')
      throw err
    }
  }

  return { patients, loading, error, loadPatients, updatePatient }
}
```

This comprehensive component architecture provides a solid foundation for building the medical tourism patient management system with proper separation of concerns, type safety, and real-time capabilities.