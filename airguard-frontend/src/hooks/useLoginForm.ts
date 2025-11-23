import { useState } from "react";
import { LoginFormData, ValidationErrors } from "@/types/login";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { apiService } from "@/services/api";

export function useLoginForm() {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
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

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      showError("Email Required", "Please enter your email address");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      showError("Invalid Email", "Please enter a valid email address");
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      showError("Password Required", "Please enter your password");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.debug('[Login] Form submit triggered');
    if (!validateForm()) {
      console.debug('[Login] Validation failed', errors);
      return;
    }
    console.debug('[Login] Validation passed');

    // Show local loading state
    setIsLoading(true);
    console.debug('[Login] Loading started');

    try {
      // Call the login API (tokens are automatically stored in httpOnly cookies)
      console.debug('[Login] Calling login API', formData.email);
      const response = await apiService.login({
        email: formData.email,
        password: formData.password,
      });
      console.debug('[Login] API call success', response);

      // Show success message
      showSuccess("Login Successful", `Welcome back, ${response.user.fullName}!`);

      // Small delay to show success message before navigation
      setTimeout(() => {
        router.replace("/dashboard/home");
        console.debug('[Login] Navigation to /dashboard/home');
      }, 1000);
    } catch (error) {
      console.error('[Login] Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      
      // Show error toast
      showError("Login Failed", errorMessage);
      
      // Keep the inline error for form field highlighting
      setErrors({
        email: errorMessage,
      });
    } finally {
      // Hide local loading state
      setIsLoading(false);
      console.debug('[Login] Loading hidden');
    }
  };

  return {
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleSubmit,
  };
}
