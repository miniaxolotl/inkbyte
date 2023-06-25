import React, { ChangeEvent, FormEvent, ReactNode, useState } from "react";

import { type AnyObject, type ObjectSchema } from "yup";
import { Notification } from "@mantine/core";

import { Box } from "@lib/components";

import {
  BaseInputProps,
  FormControl,
  FormControlProps,
  InputFieldProps,
  InputFieldValues,
} from "./form-input";
import { validateForm } from "./helpers";

export type HookFormState<
  T extends InputFieldValues = { [x: string]: string },
> = {
  register: (name: keyof T) => Omit<BaseInputProps, "name"> & { name: keyof T };
  link: (name: keyof T) => Omit<InputFieldProps, "name"> & { name: keyof T };
  getState: () => Partial<T>;
  getField: (field: keyof T) => string;
  setField: (field: keyof T, value: string) => void;
  getError: () => Partial<T>;
  setError: (error: Partial<T>) => void;
  getSubmitError: () => SubmitError | null;
  setSubmitError: (value?: SubmitError) => void;
  isValidating: boolean;
  isUpdating: boolean;
  isSubmitting: boolean;
};

type HookFormOptions<T extends InputFieldValues> = {
  initialState?: Partial<T>;
  initialErrors?: Partial<T>;
  handleSubmit?: (values: T, helpers: HookFormState<T>) => Promise<void>;
  schema?: ObjectSchema<AnyObject>;
  hideNotifications?: boolean;
};

type SubmitError = {
  heading: string;
  content: string;
} | null;

type HookFormProps<T extends InputFieldValues> = HookFormOptions<T> & {
  children?: (state: HookFormState<T>) => ReactNode;
  withError?: boolean;
};

const HookForm = <T extends InputFieldValues>(props: HookFormProps<T>) => {
  const {
    children,
    initialState = {} as Partial<T>,
    initialErrors = {} as Partial<T>,
    schema,
  } = props;

  const [state, setState] = useState({
    submitAttempts: 0,
    touchedFields: {} as T,
    values: initialState,
    errors: initialErrors,
    error: null as SubmitError,
  });

  const [action, setAction] = useState({
    isValidating: false,
    isUpdating: false,
    isSubmitting: false,
  });

  const setValidating = (state: boolean) => {
    setAction({
      ...action,
      isUpdating: state,
      isValidating: !!schema && state,
    });
  };

  const setUpdating = (state: boolean) => {
    setAction({
      ...action,
      isUpdating: state,
    });
  };

  const setSubmitting = (state: boolean) => {
    setAction({
      ...action,
      isSubmitting: state,
      isUpdating: state,
    });
  };

  const getState = () => state.values;
  const getField = (field: keyof T) => state.values[field] as string;
  const setField = (field: keyof T, value: string) => {
    setState({
      ...state,
      touchedFields: {
        ...state.touchedFields,
        [field]: true,
      },
      values: {
        ...state.values,
        [field]: value,
      },
    });
  };

  const getError = () => state.errors;
  const getFieldError = (field: keyof T) => state.errors[field] as string;
  const setError = (errors: Partial<T>) => {
    setState({
      ...state,
      errors,
    });
  };

  const isTouched = (field: keyof T) => state.touchedFields[field] as string;
  const setTouched = (field: keyof T) => {
    setState({
      ...state,
      touchedFields: {
        ...state.touchedFields,
        [field]: true,
      },
    });
  };

  const getSubmitError = () => state.error;
  const setSubmitError = (error?: SubmitError) => {
    setState({
      ...state,
      error: error ?? null,
    });
  };

  const hasSubmit = () => !!state.submitAttempts;
  const getSubmitAttempts = () => state.submitAttempts;
  const incrementSubmit = () => {
    setState({ ...state, submitAttempts: ++state.submitAttempts });
  };

  const validate = validateForm;

  const register = (name: keyof T) => {
    const handleChange = (value: string) => {
      setUpdating(true);
      if (!schema) return setField(name, value);
      setValidating(true);
      const { errors } = validate(schema, { ...state.values, [name]: value });
      setValidating(false);
      setState({
        ...state,
        errors: (errors as T) ?? ({} as T),
        values: {
          ...state.values,
          [name]: value,
        },
      });
      setUpdating(false);
    };

    const handleFocus = () => {
      // if (!isTouched(name)) setTouched(name);
    };

    const handleBlur = () => {
      if (!isTouched(name)) setTouched(name);
    };

    return {
      name,
      handleChange,
      handleFocus,
      handleBlur,
      value: getField(name),
      error: hasSubmit() || isTouched(name) ? getFieldError(name) : null,
      isValidating: action.isValidating,
      isUpdating: action.isUpdating,
      isSubmitting: action.isSubmitting,
    };
  };

  const link = (name: keyof T) => {
    const handleChange = (value: string) => {
      setUpdating(true);
      if (!schema) return setField(name, value);
      setValidating(true);
      const { errors } = validate(schema, { ...state.values, [name]: value });
      setValidating(false);
      setState({
        ...state,
        errors: (errors as T) ?? ({} as T),
        values: {
          ...state.values,
          [name]: value,
        },
      });
      setUpdating(false);
    };

    const handleFocus = () => {
      // if (!isTouched(name)) setTouched(name);
    };

    const handleBlur = () => {
      if (!isTouched(name)) setTouched(name);
    };

    return {
      name,
      onChange: (e: ChangeEvent<HTMLInputElement> | string | null) => {
        if (!e) return;
        if (typeof e === "string") return handleChange(e);
        if (e.target.type === "checkbox")
          return handleChange(`${e.target.checked}`);
        handleChange(e.target.value);
      },
      onFocus: handleFocus,
      onBlur: handleBlur,
      value: getField(name),
    };
  };

  const helpers = {
    register,
    link,
    getState,
    getField,
    getFieldError,
    setField,
    setError,
    getError,
    setSubmitError,
    getSubmitError,
    isTouched,
    setTouched,
    hasSubmit,
    incrementSubmit,
    getSubmitAttempts,
    isValidating: action.isValidating,
    isUpdating: action.isUpdating,
    isSubmitting: action.isSubmitting,
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (schema) {
      setValidating(true);
      const { errors } = validate(schema, { ...state.values });
      if (errors) setError(errors as Partial<T>);
      setValidating(false);
    }

    if (
      Object.keys(state.errors).length ||
      !Object.keys(state.values).length ||
      !Object.keys(state.touchedFields).length
    ) {
      return;
    }

    setSubmitting(true);
    incrementSubmit();

    if (props.handleSubmit) {
      await props.handleSubmit(state.values as T, helpers);
    }
    setSubmitting(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        // maxWidth: 680,
        form: {
          display: "flex",
          flexDirection: "column",
          placeSelf: "center",
          justifySelf: "center",
          alignSelf: "center",
          gap: 16,
        },
        "@media (max-width: 980px)": {
          // maxWidth: 480,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        {children && children(helpers)}
        {props.withError && !!state.error && (
          <Notification
            color="brand-red"
            title={state.error.heading}
            withCloseButton={false}
            loading={action.isUpdating}
          >
            {state.error.content}
          </Notification>
        )}
      </form>
    </Box>
  );
};

export const useHookForm = <
  T extends InputFieldValues = { [x: string]: string },
>(
  options: HookFormOptions<T> = {},
) => {
  type FormComponentProps = {
    children?: (state: HookFormState<T>) => ReactNode;
    withError?: boolean;
  };

  const FormComponent = (props: FormComponentProps) => {
    const { children } = props;
    return (
      <HookForm<T> {...options} {...props}>
        {children}
      </HookForm>
    );
  };

  const InputComponent = (props: FormControlProps<T>) => (
    <FormControl {...props} />
  );

  return {
    HookForm: FormComponent,
    InputComponent,
  };
};
