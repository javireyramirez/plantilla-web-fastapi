import * as React from 'react';

import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

interface DataTableDebouncedInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'onChange' | 'value'
> {
  value: string | number;
  onChange: (value: string | number) => void;
  delay?: number;
}

export function DataTableDebouncedInput({
  value: initialValue,
  onChange,
  delay = 500,
  ...props
}: DataTableDebouncedInputProps) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const debouncedOnChange = useDebouncedCallback(onChange, delay);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        debouncedOnChange(e.target.value);
      }}
    />
  );
}
