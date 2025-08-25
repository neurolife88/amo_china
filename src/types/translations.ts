// Типы для переводов - обеспечивают типобезопасность и автодополнение

export interface CommonTranslations {
  loading: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  close: string;
  back: string;
  next: string;
  search: string;
  filter: string;
  clear: string;
  submit: string;
  confirm: string;
  yes: string;
  no: string;
  ok: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface NavigationTranslations {
  dashboard: string;
  patients: string;
  users: string;
  settings: string;
  profile: string;
  logout: string;
}

export interface AuthTranslations {
  login: string;
  signup: string;
  email: string;
  password: string;
  confirmPassword: string;
  forgotPassword: string;
  resetPassword: string;
  loginSuccess: string;
  loginError: string;
  logoutSuccess: string;
}

export interface PatientTranslations {
  title: string;
  addPatient: string;
  editPatient: string;
  deletePatient: string;
  patientInfo: string;
  fullName: string;
  chineseName: string;
  phone: string;
  email: string;
  passport: string;
  country: string;
  clinic: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  apartment: string;
  notes: string;
  transport: string;
  flightNumber: string;
  city: string;
  terminal: string;
  passengersCount: string;
  visaExpiry: string;
  lastDayInChina: string;
  daysUntilVisaExpires: string;
  expiresToday: string;
  expiredDaysAgo: string;
  daysLeft: string;
  searchPlaceholder: string;
  noPatientsFound: string;
  tryChangeFilters: string;
  clinicTitle: string;
  tableHeaders: {
    patient: string;
    chineseName: string;
    country: string;
    clinic: string;
    dealStatus: string;
    arrivalDateTime: string;
    transport: string;
    flight: string;
    apartment: string;
    visaType: string;
    visaDays: string;
    expires: string;
    passportNumber: string;
    city: string;
    notes: string;
    actions: string;
    departureDateTime: string;
    departureCity: string;
    departureFlight: string;
    apartmentNumber: string;
    airportCode: string;
    arrivalCity: string;
    terminal: string;
    passengers: string;
    visaExpiryDate: string;
    chinaEntryDate: string;
    expiryDate: string;
    birthDate: string;
    passport: string;
    phone: string;
    email: string;
    position: string;
  };
  actions: {
    addTickets: string;
    editTickets: string;
    update: string;
    edit: string;
    save: string;
    cancel: string;
    delete: string;
  };
  statuses: {
    ticketsPurchased: string;
    onTreatment: string;
    apartmentOrdered: string;
    returnTickets: string;
    active: string;
    expiringSoon: string;
    expired: string;
  };
  placeholders: {
    selectCity: string;
    selectTransport: string;
    clickToEdit: string;
  };
  modals: {
    returnTickets: {
      title: string;
      transportType: string;
      city: string;
      dateTime: string;
      flightNumber: string;
      save: string;
      cancel: string;
    };
    editNotes: {
      title: string;
      patient: string;
      notes: string;
      save: string;
      cancel: string;
    };
  };
  toasts: {
    success: {
      updated: string;
      patientDataUpdated: string;
      entryDateUpdated: string;
      notesUpdated: string;
      returnTicketsSaved: string;
    };
    error: {
      updateFailed: string;
      failedToUpdate: string;
      failedToUpdateNotes: string;
      failedToSave: string;
    };
  };
  mobileCards: {
    arrivalDateTime: string;
    arrival: string;
    country: string;
    clinic: string;
    dealStatus: string;
    transport: string;
    airportCode: string;
    arrivalCity: string;
    flight: string;
    terminal: string;
    passengersCount: string;
    apartment: string;
    notes: string;
    showFull: string;
    collapse: string;
    departure: string;
    date: string;
    city: string;
    treatment: string;
    status: string;
    startDate: string;
    visa: string;
    type: string;
    visaDays: string;
    daysUntilExpiry: string;
    expiresToday: string;
    expiredDaysAgo: string;
    expiryDate: string;
    personalData: string;
    phone: string;
    email: string;
    passport: string;
    basicInfo: string;
    clinicNotSpecified: string;
    noName: string;
  };
}

export interface StatusTranslations {
  arriving: string;
  inTreatment: string;
  departed: string;
  unknown: string;
}

export interface TransportTranslations {
  plane: string;
  train: string;
}

export interface SectionTranslations {
  arrival: string;
  treatment: string;
  departure: string;
  visa: string;
  personal: string;
  basic: string;
}

export interface ActionTranslations {
  addReturnTickets: string;
  editReturnTickets: string;
  updateNotes: string;
  updateChineseName: string;
}

export interface MessageTranslations {
  patientUpdated: string;
  notesUpdated: string;
  chineseNameUpdated: string;
  returnTicketsUpdated: string;
  updateError: string;
  saveError: string;
  deleteConfirm: string;
  noData: string;
  noPatients: string;
  loadError: string;
}

export interface FilterTranslations {
  all: string;
  arrival: string;
  treatment: string;
  departure: string;
  visa: string;
  personal: string;
  byStatus: string;
  byClinic: string;
  byDate: string;
  searchByName: string;
}

export interface UserTranslations {
  title: string;
  addUser: string;
  editUser: string;
  deleteUser: string;
  role: string;
  roles: {
    super_admin: string;
    director: string;
    coordinator: string;
  };
  clinicName: string;
  lastLogin: string;
  status: string;
  active: string;
  inactive: string;
}

export interface LanguageTranslations {
  russian: string;
  chinese: string;
}

// Главный интерфейс всех переводов
export interface Translations {
  common: CommonTranslations;
  navigation: NavigationTranslations;
  auth: AuthTranslations;
  patients: PatientTranslations;
  statuses: StatusTranslations;
  transport: TransportTranslations;
  sections: SectionTranslations;
  actions: ActionTranslations;
  messages: MessageTranslations;
  filters: FilterTranslations;
  users: UserTranslations;
  language: LanguageTranslations;
}

// Типы для ключей переводов (для автодополнения)
export type TranslationKey = keyof Translations;
export type CommonKey = keyof CommonTranslations;
export type PatientKey = keyof PatientTranslations;
export type AuthKey = keyof AuthTranslations;
export type NavigationKey = keyof NavigationTranslations;
