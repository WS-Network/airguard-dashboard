"use client";

import { useRouter } from "next/navigation";
import { useLoginForm } from "@/hooks/useLoginForm";
import LoginHeader from "@/components/login/LoginHeader";
import LoginFields from "@/components/login/LoginFields";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const { formData, errors, isLoading, handleInputChange, handleSubmit } = useLoginForm();

  const handleSignupRedirect = () => {
    router.push("/signup");
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password logic
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative p-8">
      <LoginHeader onSignupRedirect={handleSignupRedirect} />

      {/* Login Form */}
      <div className="w-full max-w-sm flex justify-center items-center flex-col mt-10 lg:mt-0">
        <h1 className="text-4xl font-bold mb-2">Login</h1>

        <form
          className="w-full flex flex-col justify-center items-center"
          onSubmit={handleSubmit}
        >
          <LoginFields
            formData={formData}
            onInputChange={handleInputChange}
            errors={errors}
            disabled={isLoading}
          />

          <div className="w-full flex flex-col items-center mt-6">
            <button 
              type="submit" 
              className="ag-button w-full mb-4 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
            <button
              type="button"
              className="ag-text-button text-sm"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
