import React, {
  ChangeEvent,
  Ref,
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

import { Input, InputProps, Loader } from "@mantine/core";
import _ from "lodash";

import { Box } from "@lib/components";

export type BaseInputType = "text" | "password";

export type BaseInputAutoComplete =
  | "email"
  | "username"
  | "current-password"
  | "new-password"
  | "cc-number"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "name"
  | "given-name"
  | "family-name"
  | "street-address"
  | "postal-code"
  | "country"
  | "address-level2"
  | "address-level1"
  | "tel"
  | "off";

export type BaseInputState = {
  getValue: () => string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
};

export type BaseInputProps = Omit<InputProps, "autoComplete"> & {
  name: string;
  label?: string;
  placeholder?: string;
  type?: BaseInputType;
  autoComplete?: BaseInputAutoComplete;
  error?: string | null;
  value?: string;
  showLabel?: boolean;
  showError?: boolean;
  handleChange?: (value: string, state: BaseInputState) => void | Promise<void>;
  handleFocus?: () => void | Promise<void>;
  handleBlur?: () => void | Promise<void>;
  isValidating?: boolean;
  isUpdating?: boolean;
  isSubmitting?: boolean;
};

const BaseInputComponent = (
  props: BaseInputProps,
  ref: Ref<HTMLInputElement>,
) => {
  const { showLabel = false, showError = false, value = "" } = props;
  const [formValue, setFormValue] = useState(value);
  const id = useId();

  const label = useMemo(
    () => props.label ?? _.startCase(props.name),
    [props.label, props.name],
  );

  const placeholder = useMemo(
    () => props.placeholder ?? props.label ?? _.startCase(props.name),
    [props.label, props.name, props.placeholder],
  );

  const onChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const changeValue = e.target.value;
      const getValue = () => changeValue;
      const componentState = { setValue: setFormValue, getValue };
      if (props.handleChange)
        await props.handleChange(changeValue, componentState);
      setFormValue(changeValue);
    },
    [props],
  );

  const onFocus = useCallback(async () => {
    if (props.handleFocus) await props.handleFocus();
  }, [props]);

  const onBlur = useCallback(async () => {
    if (props.handleBlur) await props.handleBlur();
  }, [props]);

  type ErrorComponentProps = {
    error?: string;
  };

  const ErrorComponent = (props: ErrorComponentProps) => (
    <Box
      className="base-input-error-container"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        color: "red",
        ".base-input-error-indicator": {
          backgroundColor: "red",
          borderRadius: "4px",
          width: 12,
          height: 12,
        },
        ".base-input-error-message": {
          "::after": { content: `"${props.error}"` },
        },
      }}
    >
      <span className="base-input-error-indicator" />
      <span className="base-input-error-message" color="brand-red" />
    </Box>
  );

  return (
    <Box
      className="base-input-container"
      sx={{
        ...props.sx,
        input: { padding: "4px 16px" },
        fontSize: 12,
      }}
    >
      {showLabel && <label htmlFor={id}>{label}</label>}
      <Input
        {..._.omit(props, [
          "handleChange",
          "handleFocus",
          "handleBlur",
          "showLabel",
          "showError",
          "isValidating",
          "isUpdating",
          "isSubmitting",
        ])}
        icon={
          props.isSubmitting ? <Loader size={props.size ?? "xs"} /> : props.icon
        }
        ref={ref}
        aria-label={props.name}
        id={id}
        name={props.name}
        placeholder={placeholder}
        size={props.size ?? "xs"}
        sx={{ ...props.sx, fontSize: 12 }}
        className="base-input"
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        value={value ?? formValue}
      />
      {showError && !!props.error && <ErrorComponent error={props.error} />}
    </Box>
  );
};

export const BaseInput = forwardRef(BaseInputComponent);
