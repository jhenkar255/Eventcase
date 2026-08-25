import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const FieldWrap = ({ label, error, hint, required, children, id }: FieldProps & { children: ReactNode; id?: string }) => (
  <div>
    {label && (
      <label htmlFor={id} className="label-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, required, className = '', id, ...rest }, ref) => (
  <FieldWrap label={label} error={error} hint={hint} required={required} id={id}>
    <input ref={ref} id={id} className={`input-base ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`} aria-invalid={!!error} {...rest} />
  </FieldWrap>
));
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, placeholder, className = '', id, ...rest }, ref) => (
    <FieldWrap label={label} error={error} hint={hint} required={required} id={id}>
      <select ref={ref} id={id} className={`input-base ${error ? 'border-red-400' : ''} ${className}`} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  )
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className = '', id, ...rest }, ref) => (
    <FieldWrap label={label} error={error} hint={hint} required={required} id={id}>
      <textarea ref={ref} id={id} rows={4} className={`input-base resize-y ${error ? 'border-red-400' : ''} ${className}`} {...rest} />
    </FieldWrap>
  )
);
Textarea.displayName = 'Textarea';
