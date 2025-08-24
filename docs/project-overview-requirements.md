# Project Overview and Requirements

## Project Description

A web interface for medical tourism staff in China serving 4 clinics where international patients receive medical services. The platform provides complete patient management from arrival to departure.

## Key System Functions

1. **AMO CRM Synchronization** - Automatic patient arrival data retrieval
2. **Advance Accommodation Preparation** - Apartment assignment before patient arrival  
3. **Arrival Monitoring** - Patient status tracking through different treatment stages
4. **Departure Planning** - Ticket organization and visa deadline management
5. **Real-time Monitoring** - Live information across all processes
6. **Change Auditing** - Complete operation logging (super_admin access only)
7. **Three-tier Access** - From clinic-specific coordinator to director of all clinics

## Target Users

- **Coordinator** - Patient meeting and departure coordination for **specific clinic**
- **Director** - General monitoring and management of all 4 clinics  
- **Super Administrator** - Complete system management

## Technical Architecture

### Technology Stack
- **Development Platform**: CURSOR IDE
- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS v3.x
- **State Management**: React Context + useReducer
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth with RLS
- **Deployment**: Beget.ru hosting
- **Monitoring**: Supabase Analytics

### Architectural Principles
- **Multi-tenant** - Strict data separation by clinics
- **Role-based access** - Data access by roles and clinic assignment
- **Real-time first** - Live updates for all tables
- **Mobile-first** - Mobile device priority
- **Audit trail** - Complete operation logging

## Data Sources and Editing

- **AMO CRM** → **Supabase** → **Web Interface**
- Primary data entered in AMO CRM
- Data automatically synchronized to Supabase
- Web Interface used for viewing and editing specific fields

## User Roles and Permissions

### Coordinator
- View patients **only from their specific clinic**
- Edit accommodation and departure fields
- Cannot access other clinics' data

### Director  
- View all clinics without editing capabilities
- Cross-clinic monitoring and analysis
- Strategic oversight functions

### Super Administrator
- Full access to all data and settings
- User management capabilities
- System audit and configuration access

## Core Functional Requirements

### 1. Single Patient Table (Main Interface)
**Data Source**: Master View from existing Supabase database

#### Always Visible Basic Information:
- **Patient Full Name** - from contacts (first_name + last_name)
- **Clinic** - from deals.clinic_name
- **Patient Status** - computed field (Arriving/In Treatment/Departing)  
- **Arrival Date** - from tickets_to_china.arrival_datetime

#### Read-only Fields (from AMO CRM):
- **Arrival Data**: date/time, transport, city, flight, terminal, passengers
- **Personal Data**: phone, email, passport, country, birthday
- **Visa Data**: visa type, visa days, corridor dates
- **Deal Data**: name, status, sales pipeline

#### Coordinator-Editable Fields:
- **Apartment Number** (`room_number`) - **advance preparation for patient arrival** 
- **Departure City** (`departure_city`) - departure point
- **Departure Date/Time** (`departure_datetime`) - departure planning
- **Departure Flight Number** (`departure_flight_number`) - ticket details

### 2. Filtering and Search
- **Patient name search** - for all roles
- **Clinic search** - additional for director
- **Date filters**: Today, tomorrow, week, date range
- **Status filters**: Arriving, in treatment, departing, all
- **Clinic filters**:
  - Coordinator - **automatically only their clinic** (other clinics unavailable)
  - Director/Super-admin - select any clinic
- **Reset filters** with single button

### 3. Responsive Design
- **Mobile-first approach** - mobile device priority (375px+)
- **Cards on mobile** - convenient patient data viewing
- **Table on desktop** - compact list display
- **Touch-friendly interface** - large buttons, convenient gestures
- **Field grouping** - buttons to show/hide field groups

### 4. Real-time Updates
- **AMO CRM synchronization** - automatic new data retrieval
- **Coordinator changes** - instant edit display
- **WebSocket subscriptions** - via Supabase real-time channels
- **Visual updates** - smooth change animations

### 5. Visa Monitoring (Auto-computed Fields)
- **Visa expiry date** - arrival_datetime + visa_days
- **Days until expiry** - difference with current date
- **Visa status** - Active/Expiring Soon/Expired
- **Visual alerts** - color highlighting for urgent cases

### 6. Quick Editing (Editable Fields)
- **Inline editing** - edit directly in table/card
- **Advance preparation** - apartment assignment before patient arrival
- **Modal windows** - for complex departure planning
- **Data validation** - date and format checking
- **Auto-save** - instant change saving

## Success Criteria

- Coordinators can efficiently prepare accommodations in advance
- Real-time patient status tracking across all treatment stages
- Streamlined departure planning with visa deadline awareness
- Role-based data access ensuring clinic-specific workflow
- Mobile-optimized interface for on-the-go clinic staff