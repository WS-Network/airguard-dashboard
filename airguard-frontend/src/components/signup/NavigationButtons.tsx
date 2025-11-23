import { Loader2 } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export default function NavigationButtons({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSubmit,
  isLoading = false,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="w-full flex gap-4 mt-4">
      {currentStep > 1 && (
        <button 
          type="button" 
          className="ag-back-button" 
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </button>
      )}
      <button
        type="button"
        className="ag-button flex items-center justify-center"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={isLoading}
      >
        {isLoading && isLastStep ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          isLastStep ? "Sign Up" : "Next"
        )}
      </button>
    </div>
  );
}
