import { useState } from "react";
import { SignupFormData, ValidationErrors } from "@/types/signup";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { apiService } from "@/services/api";

export function useSignupForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    country: "",
    phoneNumber: "",
    nonGovernmentEndUser: false,
    companyName: "",
    industry: "",
    businessType: "",
    hearAboutUs: "",
    acceptTerms: false,
    newsPromotions: false,
  });
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ""));
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = "Please select a country";
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Company name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    // Industry validation
    if (!formData.industry) {
      newErrors.industry = "Please select an industry";
    }

    // Business type validation
    if (!formData.businessType) {
      newErrors.businessType = "Please select a business type";
    }

    // How did you hear about us validation
    if (!formData.hearAboutUs) {
      newErrors.hearAboutUs = "Please tell us how you heard about us";
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms =
        "You must accept the Terms of Use and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    console.debug('[Signup] Form submit triggered');
    if (!validateStep2()) {
      console.debug('[Signup] Validation failed', errors);
      return;
    }
    console.debug('[Signup] Validation passed');

    // Show local loading state
    setIsLoading(true);
    console.debug('[Signup] Loading started');

    try {
      // Call the signup API (tokens are automatically stored in httpOnly cookies)
      console.debug('[Signup] Calling signup API', formData.email);
      const response = await apiService.signup(formData);
      console.debug('[Signup] API call success', response);

      // Show success message
      showSuccess("Account Created Successfully", `Welcome to Airguard, ${response.user.fullName}!`);

      // Small delay to show success message before navigation
      setTimeout(() => {
        router.replace("/dashboard/home");
        console.debug('[Signup] Navigation to /dashboard/home');
      }, 1000);
    } catch (error) {
      console.error('[Signup] Signup failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      
      // Show error toast
      showError("Signup Failed", errorMessage);
      
      // Keep the inline error for form field highlighting
      setErrors({
        email: errorMessage,
      });
    } finally {
      // Hide local loading state
      setIsLoading(false);
      console.debug('[Signup] Loading hidden');
    }
  };
  return {
    currentStep,
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
  };
}
