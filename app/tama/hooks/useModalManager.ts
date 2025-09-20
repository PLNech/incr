import { useState, useCallback } from 'react';

export type ModalType =
  | 'skills'
  | 'buildings'
  | 'crafting'
  | 'craftbook'
  | 'contracts'
  | 'saveMenu'
  | 'adventure'
  | 'upgrades'
  | 'employment'
  | 'compensation';

interface ModalState {
  activeModal: ModalType | null;
  modalData?: any;
}

export const useModalManager = () => {
  const [modalState, setModalState] = useState<ModalState>({
    activeModal: null,
    modalData: undefined
  });

  const openModal = useCallback((modal: ModalType, data?: any) => {
    setModalState({ activeModal: modal, modalData: data });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ activeModal: null, modalData: undefined });
  }, []);

  const isModalOpen = useCallback((modal: ModalType): boolean => {
    return modalState.activeModal === modal;
  }, [modalState.activeModal]);

  // Individual modal helpers for backward compatibility
  const modalHelpers = {
    skills: {
      isOpen: isModalOpen('skills'),
      open: () => openModal('skills'),
      close: closeModal
    },
    buildings: {
      isOpen: isModalOpen('buildings'),
      open: () => openModal('buildings'),
      close: closeModal
    },
    crafting: {
      isOpen: isModalOpen('crafting'),
      open: () => openModal('crafting'),
      close: closeModal
    },
    craftbook: {
      isOpen: isModalOpen('craftbook'),
      open: () => openModal('craftbook'),
      close: closeModal
    },
    contracts: {
      isOpen: isModalOpen('contracts'),
      open: () => openModal('contracts'),
      close: closeModal
    },
    saveMenu: {
      isOpen: isModalOpen('saveMenu'),
      open: () => openModal('saveMenu'),
      close: closeModal
    },
    adventure: {
      isOpen: isModalOpen('adventure'),
      open: () => openModal('adventure'),
      close: closeModal
    },
    upgrades: {
      isOpen: isModalOpen('upgrades'),
      open: () => openModal('upgrades'),
      close: closeModal
    },
    employment: {
      isOpen: isModalOpen('employment'),
      open: () => openModal('employment'),
      close: closeModal
    },
    compensation: {
      isOpen: isModalOpen('compensation'),
      open: (data?: any) => openModal('compensation', data),
      close: closeModal
    }
  };

  return {
    activeModal: modalState.activeModal,
    modalData: modalState.modalData,
    openModal,
    closeModal,
    isModalOpen,
    modals: modalHelpers
  };
};