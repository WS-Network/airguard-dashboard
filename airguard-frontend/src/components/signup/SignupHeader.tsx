import Image from "next/image";
import logo from "@/assets/ag_logo.png";

interface SignupHeaderProps {
  onLoginRedirect: () => void;
}

export default function SignupHeader({ onLoginRedirect }: SignupHeaderProps) {
  return (
    <>
      {/* Logo */}
      <div className="lg:absolute lg:top-10 lg:left-10">
        <Image
          src={logo}
          alt="Airguard Logo"
          width={256}
          height={256}
          priority
        />
      </div>

      {/* Change to Login | Desktop */}
      <div className="absolute top-10 right-10 hidden lg:block">
        <button className="ag-text-button" onClick={onLoginRedirect}>
          Already have an account?
        </button>
      </div>

      {/* Change to Login | Mobile */}
      <div className="lg:hidden w-full flex justify-center mt-2">
        <button className="ag-text-button" onClick={onLoginRedirect}>
          Already have an account?
        </button>
      </div>
    </>
  );
}
