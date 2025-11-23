import Image from "next/image";
import logo from "@/assets/ag_logo.png";

interface LoginHeaderProps {
  onSignupRedirect: () => void;
}

export default function LoginHeader({ onSignupRedirect }: LoginHeaderProps) {
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

      {/* Change to Signup | Desktop */}
      <div className="absolute top-10 right-10 hidden lg:block">
        <button className="ag-text-button" onClick={onSignupRedirect}>
          Don&apos;t have an account?
        </button>
      </div>

      {/* Change to Signup | Mobile */}
      <div className="lg:hidden w-full flex justify-center mt-2">
        <button className="ag-text-button" onClick={onSignupRedirect}>
          Don&apos;t have an account?
        </button>
      </div>
    </>
  );
}
