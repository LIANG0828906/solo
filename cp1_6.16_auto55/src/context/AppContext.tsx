import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Pet, Application, AppState, ApplicationStatus, PetStatus, FormData, HousingType } from '../types';
import { initialPets } from '../data/PetData';

interface AppContextType {
  state: AppState;
  addApplication: (petId: string, formData: FormData) => Application;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, remark?: string) => void;
  addPet: (pet: Omit<Pet, 'id' | 'status' | 'adoptionCount'>) => void;
  getPetById: (petId: string) => Pet | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    pets: initialPets,
    applications: [],
  });

  const addApplication = useCallback((petId: string, formData: FormData): Application => {
    const pet = state.pets.find(p => p.id === petId);
    if (!pet) {
      throw new Error('Pet not found');
    }

    const newApplication: Application = {
      id: uuidv4(),
      petId: pet.id,
      petName: pet.name,
      applicantName: formData.name,
      phone: formData.phone,
      housingType: formData.housingType as HousingType,
      experience: formData.experience,
      status: ApplicationStatus.PENDING,
      submitTime: Date.now(),
    };

    setState(prev => ({
      ...prev,
      applications: [newApplication, ...prev.applications],
      pets: prev.pets.map(p =>
        p.id === petId
          ? { ...p, status: PetStatus.PENDING, adoptionCount: p.adoptionCount + 1 }
          : p
      ),
    }));

    return newApplication;
  }, [state.pets]);

  const updateApplicationStatus = useCallback((
    applicationId: string,
    status: ApplicationStatus,
    remark?: string
  ) => {
    setState(prev => {
      const application = prev.applications.find(a => a.id === applicationId);
      if (!application) return prev;

      const updatedApplications = prev.applications.map(a =>
        a.id === applicationId ? { ...a, status, remark } : a
      );

      let updatedPets = prev.pets;
      if (status === ApplicationStatus.APPROVED) {
        updatedPets = prev.pets.map(p =>
          p.id === application.petId ? { ...p, status: PetStatus.ADOPTED } : p
        );
      } else if (status === ApplicationStatus.REJECTED) {
        const hasOtherPending = updatedApplications.some(
          a => a.petId === application.petId && a.status === ApplicationStatus.PENDING
        );
        if (!hasOtherPending) {
          updatedPets = prev.pets.map(p =>
            p.id === application.petId ? { ...p, status: PetStatus.AVAILABLE } : p
          );
        }
      }

      return {
        ...prev,
        applications: updatedApplications,
        pets: updatedPets,
      };
    });
  }, []);

  const addPet = useCallback((pet: Omit<Pet, 'id' | 'status' | 'adoptionCount'>) => {
    const newPet: Pet = {
      ...pet,
      id: uuidv4(),
      status: PetStatus.AVAILABLE,
      adoptionCount: 0,
    };

    setState(prev => ({
      ...prev,
      pets: [...prev.pets, newPet],
    }));
  }, []);

  const getPetById = useCallback((petId: string): Pet | undefined => {
    return state.pets.find(p => p.id === petId);
  }, [state.pets]);

  return (
    <AppContext.Provider
      value={{
        state,
        addApplication,
        updateApplicationStatus,
        addPet,
        getPetById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
