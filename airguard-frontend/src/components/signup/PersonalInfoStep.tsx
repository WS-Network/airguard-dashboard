import { SignupStepProps } from "@/types/signup";
import { countries } from "@/data/signup-options";

interface PersonalInfoStepProps extends SignupStepProps {
  disabled?: boolean;
}

export default function PersonalInfoStep({
  formData,
  onInputChange,
  errors = {},
  disabled = false,
}: PersonalInfoStepProps) {
  return (
    <>
      {" "}
      <div
        className={`ag-input-container ${errors.fullName ? "has-error" : ""}`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="fullName">
          Full Name *
        </label>{" "}
        <input
          type="text"
          id="fullName"
          name="fullName"
          className={`ag-input ${errors.fullName ? "ag-input-error" : ""}`}
          placeholder="Full Name"
          value={formData.fullName}
          onChange={onInputChange}
          disabled={disabled}
          required
        />
        {errors.fullName && (
          <span className="ag-error-message">{errors.fullName}</span>
        )}
      </div>{" "}
      <div className={`ag-input-container ${errors.email ? "has-error" : ""}`}>
        <label className="block text-sm font-medium mb-2" htmlFor="email">
          Email *
        </label>{" "}
        <input
          type="email"
          id="email"
          name="email"
          className={`ag-input ${errors.email ? "ag-input-error" : ""}`}
          placeholder="Email"
          value={formData.email}
          onChange={onInputChange}
          disabled={disabled}
          required
        />
        {errors.email && (
          <span className="ag-error-message">{errors.email}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${errors.password ? "has-error" : ""}`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="password">
          Password *
        </label>{" "}
        <input
          type="password"
          id="password"
          name="password"
          className={`ag-input ${errors.password ? "ag-input-error" : ""}`}
          placeholder="Password"
          value={formData.password}
          onChange={onInputChange}
          disabled={disabled}
          required
        />
        {errors.password && (
          <span className="ag-error-message">{errors.password}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${errors.country ? "has-error" : ""}`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="country">
          Country *
        </label>{" "}
        <select
          id="country"
          name="country"
          className={`ag-dropdown ${errors.country ? "ag-dropdown-error" : ""}`}
          value={formData.country}
          onChange={onInputChange}
          disabled={disabled}
          required
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        {errors.country && (
          <span className="ag-error-message">{errors.country}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${
          errors.phoneNumber ? "has-error" : ""
        }`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="phoneNumber">
          Phone Number *
        </label>{" "}
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          className={`ag-input ${errors.phoneNumber ? "ag-input-error" : ""}`}
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={onInputChange}
          disabled={disabled}
          required
        />
        {errors.phoneNumber && (
          <span className="ag-error-message">{errors.phoneNumber}</span>
        )}
      </div>
    </>
  );
}
