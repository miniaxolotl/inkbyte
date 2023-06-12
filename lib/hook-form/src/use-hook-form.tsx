import React, { ChangeEvent, FormEvent, ReactNode, useState } from "react";

import { type AnyObject, type ObjectSchema } from "yup";

import {
  BaseInputProps,
  FormControl,
  FormControlProps,
  InputFieldProps,
  InputFieldValues,
} from "./form-input";
import { validateForm } from "./helpers";

type HookFormState<T extends InputFieldValues> = {
  register: (name: keyof T) => Omit<BaseInputProps, "name"> & { name: keyof T };
  link: (name: keyof T) => Omit<InputFieldProps, "name"> & { name: keyof T };
  getState: () => Partial<T>;
  setField: (field: keyof T, value: string) => void;
  getField: (field: keyof T) => string;
  setError: (error: Partial<T>) => void;
  getError: () => Partial<T>;
};

type HookFormOptions<T extends InputFieldValues> = {
  initialState?: Partial<T>;
  initialErrors?: Partial<T>;
  handleSubmit?: (values: T) => void;
  schema?: ObjectSchema<AnyObject>;
};

type HookFormProps<T extends InputFieldValues> = HookFormOptions<T> & {
  children?: (state: HookFormState<T>) => ReactNode;
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

  const getTouched = (field: keyof T) => state.touchedFields[field] as string;
  const setTouched = (field: keyof T) => {
    setState({
      ...state,
      touchedFields: {
        ...state.touchedFields,
        [field]: true,
      },
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
      if (!getTouched(name)) setTouched(name);
    };

    return {
      name,
      handleChange,
      handleFocus,
      value: getField(name),
      error: hasSubmit() || getTouched(name) ? getFieldError(name) : null,
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
      if (!getTouched(name)) setTouched(name);
    };

    return {
      name,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.type === "checkbox")
          return handleChange(`${e.target.checked}`);
        handleChange(e.target.value);
      },
      onFocus: handleFocus,
      value: getField(name),
    };
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setSubmitting(true);
    incrementSubmit();

    if (schema) {
      setValidating(true);
      const { errors } = validate(schema, { ...state.values });
      if (errors) setError(errors as Partial<T>);
      setValidating(false);
    }

    if (!Object.keys(state.errors).length) return;
    if (props.handleSubmit) props.handleSubmit(state.values as T);
    setSubmitting(false);
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
    getTouched,
    setTouched,
    hasSubmit,
    incrementSubmit,
    getSubmitAttempts,
    handleSubmit,
    isValidating: action.isValidating,
    isUpdating: action.isUpdating,
    isSubmitting: action.isSubmitting,
  };

  return <form onSubmit={handleSubmit}>{children && children(helpers)}</form>;
};

export const useHookForm = <T extends InputFieldValues>(
  options: HookFormOptions<T> = {},
) => {
  type FormComponentProps = {
    children?: (state: HookFormState<T>) => ReactNode;
  };

  const FormComponent = ({ children }: FormComponentProps) => {
    return <HookForm<T> {...options}>{children}</HookForm>;
  };

  const InputComponent = (props: FormControlProps<T>) => (
    <FormControl {...props} />
  );

  return {
    HookForm: FormComponent,
    InputComponent,
  };
};
