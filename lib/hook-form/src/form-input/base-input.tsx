import React, {
  ChangeEvent,
  Ref,
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

import { Input, InputProps } from "@mantine/core";
import _ from "lodash";

import { Box } from "@lib/components";

export type BaseInputState = {
  getValue: () => string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
};

export type BaseInputProps = InputProps & {
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
      if (value && props.handleChange) {
        await props.handleChange(changeValue, componentState);
        return setFormValue(changeValue);
      }
      if (props.handleChange)
        await props.handleChange(changeValue, componentState);
      setFormValue(changeValue);
    },
    [props, value],
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
        ])}
        ref={ref}
        id={id}
        name={props.name}
        placeholder={placeholder}
        size={props.size ?? "xs"}
        sx={{ ...props.sx, fontSize: 12 }}
        className="base-input"
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        value={formValue}
      />
      {showError && !!props.error && <ErrorComponent error={props.error} />}
    </Box>
  );
};

export const BaseInput = forwardRef(BaseInputComponent);
