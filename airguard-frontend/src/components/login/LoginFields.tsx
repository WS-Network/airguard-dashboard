import { LoginFormProps } from "@/types/login";

interface LoginFieldsProps extends LoginFormProps {
  disabled?: boolean;
}

export default function LoginFields({
  formData,
  onInputChange,
  errors = {},
  disabled = false,
}: LoginFieldsProps) {
  return (
    <>
      <div className={`ag-input-container ${errors.email ? "has-error" : ""}`}>
        <label className="block text-sm font-medium mb-2" htmlFor="email">
          Email *
        </label>
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
      </div>
      <div
        className={`ag-input-container ${errors.password ? "has-error" : ""}`}
      >
        <label className="block text-sm font-medium mb-2" htmlFor="password">
          Password *
        </label>
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
      <div className="ag-input-container">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={onInputChange}
            disabled={disabled}
            className="ag-checkbox mr-2"
          />
          Remember me
        </label>
      </div>
    </>
  );
}
