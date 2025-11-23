import { SignupStepProps } from "@/types/signup";
import {
  industries,
  businessTypes,
  hearAboutOptions,
} from "@/data/signup-options";

interface BusinessInfoStepProps extends SignupStepProps {
  disabled?: boolean;
}

export default function BusinessInfoStep({
  formData,
  onInputChange,
  errors = {},
  disabled = false,
}: BusinessInfoStepProps) {
  return (
    <>
      {" "}
      <div
        className={`ag-input-container ${
          errors.companyName ? "has-error" : ""
        }`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="companyName">
          Company Name *
        </label>{" "}
        <input
          type="text"
          id="companyName"
          name="companyName"
          className={`ag-input ${errors.companyName ? "ag-input-error" : ""}`}
          placeholder="Company Name"
          value={formData.companyName}
          onChange={onInputChange}
          disabled={disabled}
          required
        />
        {errors.companyName && (
          <span className="ag-error-message">{errors.companyName}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${errors.industry ? "has-error" : ""}`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="industry">
          Which industry best describes your business? *
        </label>{" "}
        <select
          id="industry"
          name="industry"
          className={`ag-dropdown ${
            errors.industry ? "ag-dropdown-error" : ""
          }`}
          value={formData.industry}
          onChange={onInputChange}
          disabled={disabled}
          required
        >
          <option value="">Select Industry</option>
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        {errors.industry && (
          <span className="ag-error-message">{errors.industry}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${
          errors.businessType ? "has-error" : ""
        }`}
      >
        <label
          className="block text-sm font-medium mb-2"
          htmlFor="businessType"
        >
          Type? *
        </label>{" "}
        <select
          id="businessType"
          name="businessType"
          className={`ag-dropdown ${
            errors.businessType ? "ag-dropdown-error" : ""
          }`}
          value={formData.businessType}
          onChange={onInputChange}
          disabled={disabled}
          required
        >
          <option value="">Select Type</option>
          {businessTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.businessType && (
          <span className="ag-error-message">{errors.businessType}</span>
        )}
      </div>{" "}
      <div
        className={`ag-input-container ${
          errors.hearAboutUs ? "has-error" : ""
        }`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="hearAboutUs">
          How did you hear about Airguard? *
        </label>{" "}
        <select
          id="hearAboutUs"
          name="hearAboutUs"
          className={`ag-dropdown ${
            errors.hearAboutUs ? "ag-dropdown-error" : ""
          }`}
          value={formData.hearAboutUs}
          onChange={onInputChange}
          disabled={disabled}
          required
        >
          <option value="">Select Option</option>
          {hearAboutOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.hearAboutUs && (
          <span className="ag-error-message">{errors.hearAboutUs}</span>
        )}
      </div>{" "}
      {/* All Checkboxes at Bottom */}
      <div className="ag-input-container">
        <label className="flex items-center text-sm font-medium">
          <input
            type="checkbox"
            name="nonGovernmentEndUser"
            className="ag-checkbox mr-2"
            checked={formData.nonGovernmentEndUser}
            onChange={onInputChange}
            disabled={disabled}
          />
          Non-Government End User
        </label>
      </div>
      <div className="ag-input-container">
        <label className="flex items-start text-sm font-medium">
          <input
            type="checkbox"
            name="newsPromotions"
            className="ag-checkbox mr-2 mt-1"
            checked={formData.newsPromotions}
            onChange={onInputChange}
            disabled={disabled}
          />
          Yes, I&apos;d like to hear about news and promotions
        </label>
      </div>{" "}
      <div
        className={`ag-input-container ${
          errors.acceptTerms ? "has-error" : ""
        }`}
      >
        <label className="flex items-start text-sm font-medium">
          <input
            type="checkbox"
            name="acceptTerms"
            className="ag-checkbox mr-2 mt-1"
            checked={formData.acceptTerms}
            onChange={onInputChange}
            disabled={disabled}
            required
          />
          Accept the Terms of Use and Privacy Policy *{" "}
        </label>
        {errors.acceptTerms && (
          <span className="ag-error-message">{errors.acceptTerms}</span>
        )}
      </div>
    </>
  );
}
