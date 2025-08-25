import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Удобный хук для работы с переводами
// Обеспечивает автодополнение и типобезопасность
export const useTranslations = () => {
  const { t, i18n } = useTranslation();

  const translations = useMemo(() => ({
    // Общие элементы
    common: {
      loading: () => t('common.loading'),
      save: () => t('common.save'),
      cancel: () => t('common.cancel'),
      edit: () => t('common.edit'),
      delete: () => t('common.delete'),
      close: () => t('common.close'),
      back: () => t('common.back'),
      next: () => t('common.next'),
      search: () => t('common.search'),
      filter: () => t('common.filter'),
      clear: () => t('common.clear'),
      submit: () => t('common.submit'),
      confirm: () => t('common.confirm'),
      yes: () => t('common.yes'),
      no: () => t('common.no'),
      ok: () => t('common.ok'),
      error: () => t('common.error'),
      success: () => t('common.success'),
      warning: () => t('common.warning'),
      info: () => t('common.info'),
    },

    // Навигация
    navigation: {
      dashboard: () => t('navigation.dashboard'),
      patients: () => t('navigation.patients'),
      users: () => t('navigation.users'),
      settings: () => t('navigation.settings'),
      profile: () => t('navigation.profile'),
      logout: () => t('navigation.logout'),
    },

    // Авторизация
    auth: {
      login: () => t('auth.login'),
      signup: () => t('auth.signup'),
      email: () => t('auth.email'),
      password: () => t('auth.password'),
      confirmPassword: () => t('auth.confirmPassword'),
      forgotPassword: () => t('auth.forgotPassword'),
      resetPassword: () => t('auth.resetPassword'),
      loginSuccess: () => t('auth.loginSuccess'),
      loginError: () => t('auth.loginError'),
      logoutSuccess: () => t('auth.logoutSuccess'),
    },

    // Пациенты
    patients: {
      title: () => t('patients.title'),
      addPatient: () => t('patients.addPatient'),
      editPatient: () => t('patients.editPatient'),
      deletePatient: () => t('patients.deletePatient'),
      patientInfo: () => t('patients.patientInfo'),
      fullName: () => t('patients.fullName'),
      chineseName: () => t('patients.chineseName'),
      phone: () => t('patients.phone'),
      email: () => t('patients.email'),
      passport: () => t('patients.passport'),
      country: () => t('patients.country'),
      clinic: () => t('patients.clinic'),
      status: () => t('patients.status'),
      arrivalDate: () => t('patients.arrivalDate'),
      departureDate: () => t('patients.departureDate'),
      apartment: () => t('patients.apartment'),
      notes: () => t('patients.notes'),
      transport: () => t('patients.transport'),
      flightNumber: () => t('patients.flightNumber'),
      city: () => t('patients.city'),
      terminal: () => t('patients.terminal'),
      passengersCount: () => t('patients.passengersCount'),
      visaExpiry: () => t('patients.visaExpiry'),
      lastDayInChina: () => t('patients.lastDayInChina'),
      daysUntilVisaExpires: () => t('patients.daysUntilVisaExpires'),
      expiresToday: () => t('patients.expiresToday'),
      expiredDaysAgo: (days: number) => t('patients.expiredDaysAgo', { days }),
      daysLeft: (days: number) => t('patients.daysLeft', { days }),
      searchPlaceholder: () => t('patients.searchPlaceholder'),
      noPatientsFound: () => t('patients.noPatientsFound'),
      tryChangeFilters: () => t('patients.tryChangeFilters'),
      clinicTitle: (clinic: string) => t('patients.clinicTitle', { clinic }),
      tableHeaders: {
        patient: () => t('patients.tableHeaders.patient'),
        chineseName: () => t('patients.tableHeaders.chineseName'),
        country: () => t('patients.tableHeaders.country'),
        clinic: () => t('patients.tableHeaders.clinic'),
        dealStatus: () => t('patients.tableHeaders.dealStatus'),
        arrivalDateTime: () => t('patients.tableHeaders.arrivalDateTime'),
        transport: () => t('patients.tableHeaders.transport'),
        flight: () => t('patients.tableHeaders.flight'),
        apartment: () => t('patients.tableHeaders.apartment'),
        visaType: () => t('patients.tableHeaders.visaType'),
        visaDays: () => t('patients.tableHeaders.visaDays'),
        expires: () => t('patients.tableHeaders.expires'),
        passportNumber: () => t('patients.tableHeaders.passportNumber'),
        city: () => t('patients.tableHeaders.city'),
        notes: () => t('patients.tableHeaders.notes'),
        actions: () => t('patients.tableHeaders.actions'),
        departureDateTime: () => t('patients.tableHeaders.departureDateTime'),
        departureCity: () => t('patients.tableHeaders.departureCity'),
        departureFlight: () => t('patients.tableHeaders.departureFlight'),
        apartmentNumber: () => t('patients.tableHeaders.apartmentNumber'),
        airportCode: () => t('patients.tableHeaders.airportCode'),
        arrivalCity: () => t('patients.tableHeaders.arrivalCity'),
        terminal: () => t('patients.tableHeaders.terminal'),
        passengers: () => t('patients.tableHeaders.passengers'),
        visaExpiryDate: () => t('patients.tableHeaders.visaExpiryDate'),
        chinaEntryDate: () => t('patients.tableHeaders.chinaEntryDate'),
        expiryDate: () => t('patients.tableHeaders.expiryDate'),
        birthDate: () => t('patients.tableHeaders.birthDate'),
        passport: () => t('patients.tableHeaders.passport'),
        phone: () => t('patients.tableHeaders.phone'),
        email: () => t('patients.tableHeaders.email'),
        position: () => t('patients.tableHeaders.position'),
      },
      actions: {
        addTickets: () => t('patients.actions.addTickets'),
        editTickets: () => t('patients.actions.editTickets'),
        update: () => t('patients.actions.update'),
        edit: () => t('patients.actions.edit'),
        save: () => t('patients.actions.save'),
        cancel: () => t('patients.actions.cancel'),
        delete: () => t('patients.actions.delete'),
      },
      statuses: {
        ticketsPurchased: () => t('patients.statuses.ticketsPurchased'),
        onTreatment: () => t('patients.statuses.onTreatment'),
        apartmentOrdered: () => t('patients.statuses.apartmentOrdered'),
        returnTickets: () => t('patients.statuses.returnTickets'),
        active: () => t('patients.statuses.active'),
        expiringSoon: () => t('patients.statuses.expiringSoon'),
        expired: () => t('patients.statuses.expired'),
      },
      placeholders: {
        selectCity: () => t('patients.placeholders.selectCity'),
        selectTransport: () => t('patients.placeholders.selectTransport'),
        clickToEdit: () => t('patients.placeholders.clickToEdit'),
      },
      modals: {
        returnTickets: {
          title: () => t('patients.modals.returnTickets.title'),
          transportType: () => t('patients.modals.returnTickets.transportType'),
          city: () => t('patients.modals.returnTickets.city'),
          dateTime: () => t('patients.modals.returnTickets.dateTime'),
          flightNumber: () => t('patients.modals.returnTickets.flightNumber'),
          save: () => t('patients.modals.returnTickets.save'),
          cancel: () => t('patients.modals.returnTickets.cancel'),
        },
        editNotes: {
          title: () => t('patients.modals.editNotes.title'),
          patient: () => t('patients.modals.editNotes.patient'),
          notes: () => t('patients.modals.editNotes.notes'),
          save: () => t('patients.modals.editNotes.save'),
          cancel: () => t('patients.modals.editNotes.cancel'),
        },
      },
      toasts: {
        success: {
          updated: () => t('patients.toasts.success.updated'),
          patientDataUpdated: () => t('patients.toasts.success.patientDataUpdated'),
          entryDateUpdated: () => t('patients.toasts.success.entryDateUpdated'),
          notesUpdated: () => t('patients.toasts.success.notesUpdated'),
          returnTicketsSaved: () => t('patients.toasts.success.returnTicketsSaved'),
        },
        error: {
          updateFailed: () => t('patients.toasts.error.updateFailed'),
          failedToUpdate: () => t('patients.toasts.error.failedToUpdate'),
          failedToUpdateNotes: () => t('patients.toasts.error.failedToUpdateNotes'),
          failedToSave: () => t('patients.toasts.error.failedToSave'),
        },
      },
      mobileCards: {
        arrivalDateTime: () => t('patients.mobileCards.arrivalDateTime'),
        arrival: () => t('patients.mobileCards.arrival'),
        country: () => t('patients.mobileCards.country'),
        clinic: () => t('patients.mobileCards.clinic'),
        dealStatus: () => t('patients.mobileCards.dealStatus'),
        transport: () => t('patients.mobileCards.transport'),
        airportCode: () => t('patients.mobileCards.airportCode'),
        arrivalCity: () => t('patients.mobileCards.arrivalCity'),
        flight: () => t('patients.mobileCards.flight'),
        terminal: () => t('patients.mobileCards.terminal'),
        passengersCount: () => t('patients.mobileCards.passengersCount'),
        apartment: () => t('patients.mobileCards.apartment'),
        notes: () => t('patients.mobileCards.notes'),
        showFull: () => t('patients.mobileCards.showFull'),
    collapse: () => t('patients.mobileCards.collapse'),
        departure: () => t('patients.mobileCards.departure'),
        date: () => t('patients.mobileCards.date'),
        city: () => t('patients.mobileCards.city'),
        treatment: () => t('patients.mobileCards.treatment'),
        status: () => t('patients.mobileCards.status'),
        startDate: () => t('patients.mobileCards.startDate'),
        visa: () => t('patients.mobileCards.visa'),
        type: () => t('patients.mobileCards.type'),
        visaDays: () => t('patients.mobileCards.visaDays'),
        daysUntilExpiry: () => t('patients.mobileCards.daysUntilExpiry'),
        expiresToday: () => t('patients.mobileCards.expiresToday'),
        expiredDaysAgo: (days: number) => t('patients.mobileCards.expiredDaysAgo', { days }),
        expiryDate: () => t('patients.mobileCards.expiryDate'),
        personalData: () => t('patients.mobileCards.personalData'),
        phone: () => t('patients.mobileCards.phone'),
        email: () => t('patients.mobileCards.email'),
        passport: () => t('patients.mobileCards.passport'),
        basicInfo: () => t('patients.mobileCards.basicInfo'),
        clinicNotSpecified: () => t('patients.mobileCards.clinicNotSpecified'),
        noName: () => t('patients.mobileCards.noName'),
      },
    },

    // Статусы
    statuses: {
      arriving: () => t('statuses.arriving'),
      inTreatment: () => t('statuses.inTreatment'),
      departed: () => t('statuses.departed'),
      unknown: () => t('statuses.unknown'),
    },

    // Транспорт
    transport: {
      plane: () => t('transport.plane'),
      train: () => t('transport.train'),
    },

    // Секции
    sections: {
      arrival: () => t('sections.arrival'),
      treatment: () => t('sections.treatment'),
      departure: () => t('sections.departure'),
      visa: () => t('sections.visa'),
      personal: () => t('sections.personal'),
      basic: () => t('sections.basic'),
    },

    // Действия
    actions: {
      addReturnTickets: () => t('actions.addReturnTickets'),
      editReturnTickets: () => t('actions.editReturnTickets'),
      updateNotes: () => t('actions.updateNotes'),
      updateChineseName: () => t('actions.updateChineseName'),
    },

    // Сообщения
    messages: {
      patientUpdated: () => t('messages.patientUpdated'),
      notesUpdated: () => t('messages.notesUpdated'),
      chineseNameUpdated: () => t('messages.chineseNameUpdated'),
      returnTicketsUpdated: () => t('messages.returnTicketsUpdated'),
      updateError: () => t('messages.updateError'),
      saveError: () => t('messages.saveError'),
      deleteConfirm: () => t('messages.deleteConfirm'),
      noData: () => t('messages.noData'),
      noPatients: () => t('messages.noPatients'),
      loadError: (error: string) => t('messages.loadError', { error }),
    },

    // Фильтры
    filters: {
      all: () => t('filters.all'),
      arrival: () => t('filters.arrival'),
      treatment: () => t('filters.treatment'),
      departure: () => t('filters.departure'),
      visa: () => t('filters.visa'),
      personal: () => t('filters.personal'),
      byStatus: () => t('filters.byStatus'),
      byClinic: () => t('filters.byClinic'),
      byDate: () => t('filters.byDate'),
      searchByName: () => t('filters.searchByName'),
    },

    // Пользователи
    users: {
      title: () => t('users.title'),
      addUser: () => t('users.addUser'),
      editUser: () => t('users.editUser'),
      deleteUser: () => t('users.deleteUser'),
      role: () => t('users.role'),
      roles: {
        super_admin: () => t('users.roles.super_admin'),
        director: () => t('users.roles.director'),
        coordinator: () => t('users.roles.coordinator'),
      },
      clinicName: () => t('users.clinicName'),
      lastLogin: () => t('users.lastLogin'),
      status: () => t('users.status'),
      active: () => t('users.active'),
      inactive: () => t('users.inactive'),
    },

    // Языки
    language: {
      russian: () => t('language.russian'),
      chinese: () => t('language.chinese'),
    },
  }), [t]);

  return {
    t, // Оригинальная функция t для сложных случаев
    i18n, // Доступ к i18n для продвинутых операций
    ...translations, // Все удобные функции переводов
  };
};
