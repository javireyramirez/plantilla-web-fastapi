import { ReactNode } from 'react';

import { Field, FieldError } from '@/components/ui/field.js';

interface FormFieldWrapperProps {
  fieldState: any;
  children: ReactNode;
}

export default function FormFieldWrapper({ fieldState, children }: FormFieldWrapperProps) {
  return (
    <Field data-invalid={fieldState.invalid}>
      {children}
      {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
    </Field>
  );
}
