export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  country: string;
  phoneNumber: string;
  nonGovernmentEndUser: boolean;
  companyName: string;
  industry: string;
  businessType: string;
  hearAboutUs: string;
  acceptTerms: boolean;
  newsPromotions: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface SignupStepProps {
  formData: SignupFormData;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  errors?: ValidationErrors;
}
