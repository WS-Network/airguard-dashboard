export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface LoginFormProps {
  formData: LoginFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: ValidationErrors;
}
