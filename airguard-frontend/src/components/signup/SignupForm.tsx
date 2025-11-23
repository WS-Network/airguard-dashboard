"use client";

import { useRouter } from "next/navigation";
import { useSignupForm } from "@/hooks/useSignupForm";
import SignupHeader from "@/components/signup/SignupHeader";
import PersonalInfoStep from "@/components/signup/PersonalInfoStep";
import BusinessInfoStep from "@/components/signup/BusinessInfoStep";
import NavigationButtons from "@/components/signup/NavigationButtons";

export default function SignupForm() {
  const router = useRouter();
  const {
    currentStep,
    formData,
    errors,
    isLoading,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
  } = useSignupForm();

  const handleLoginRedirect = () => {
    router.push("/login");
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
            disabled={isLoading}
          />
        );
      case 2:
        return (
          <BusinessInfoStep
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
            disabled={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-8">
      <SignupHeader onLoginRedirect={handleLoginRedirect} />

      {/* Signup Form */}
      <div className="w-full max-w-sm flex justify-center items-center flex-col mt-10 lg:mt-0">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Sign Up</h1>
        <div className="text-sm text-ag-white/60 mb-2">
          Step {currentStep} of 2
        </div>

        <form className="w-full flex flex-col justify-center items-center">
          {renderCurrentStep()}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={2}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </form>
      </div>
    </div>
  );
}
