import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
} from "@workspace/ui/components/select"
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import { Row, type SectionMap } from "@/pages/components/section"

const AREAS = ["Rendering", "Physics", "ECS", "Shaders"]

export const forms: SectionMap = {
  input: () => (
    <>
      <Row label="default">
        <Input placeholder="Placeholder" className="w-52" />
        <Input defaultValue="With a value" className="w-52" />
      </Row>
      <Row label="state">
        <Input disabled placeholder="Disabled" className="w-52" />
        <Input aria-invalid placeholder="Invalid" className="w-52" />
      </Row>
    </>
  ),

  textarea: () => (
    <Row label="default">
      <Textarea placeholder="Multiple lines" className="w-72" />
    </Row>
  ),

  "input-group": () => (
    <Row label="addon">
      <InputGroup className="w-72">
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    </Row>
  ),

  "input-otp": () => (
    <Row label="six">
      <InputOTP aria-label="Verification code" maxLength={6}>
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </Row>
  ),

  checkbox: () => (
    <Row label="states">
      <Field orientation="horizontal">
        <Checkbox id="cb-off" />
        <FieldLabel htmlFor="cb-off">off</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="cb-on" defaultSelected />
        <FieldLabel htmlFor="cb-on">on</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="cb-disabled" isDisabled />
        <FieldLabel htmlFor="cb-disabled">disabled</FieldLabel>
      </Field>
    </Row>
  ),

  "radio-group": () => (
    <Row label="group">
      <RadioGroup
        aria-label="Example choice"
        defaultValue="b"
        className="flex flex-row gap-4"
      >
        {["a", "b", "c"].map((value) => (
          <Field key={value} orientation="horizontal">
            <RadioGroupItem value={value} id={`rg-${value}`} />
            <FieldLabel htmlFor={`rg-${value}`}>{value}</FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </Row>
  ),

  switch: () => (
    <Row label="states">
      <Field orientation="horizontal">
        <Switch id="sw-off" />
        <FieldLabel htmlFor="sw-off">off</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="sw-on" defaultSelected />
        <FieldLabel htmlFor="sw-on">on</FieldLabel>
      </Field>
    </Row>
  ),

  slider: () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Row label="single">
        <div className="w-64">
          <Slider aria-label="Single value" defaultValue={40} />
        </div>
      </Row>
      <Row label="range">
        <div className="w-64">
          <Slider aria-label="Range" defaultValue={[20, 70]} />
        </div>
      </Row>
    </div>
  ),

  select: () => (
    <Row label="default">
      <Select aria-label="Area" defaultSelectedKey="Physics">
        <SelectTrigger className="w-52">Physics</SelectTrigger>
        <SelectContent>
          <SelectList>
            {AREAS.map((area) => (
              <SelectItem key={area} id={area}>
                {area}
              </SelectItem>
            ))}
          </SelectList>
        </SelectContent>
      </Select>
    </Row>
  ),

  "native-select": () => (
    <Row label="default">
      <NativeSelect aria-label="Area" className="w-52">
        {AREAS.map((area) => (
          <NativeSelectOption key={area} value={area}>
            {area}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Row>
  ),

  combobox: () => (
    <Row label="default">
      <Combobox aria-label="Area" className="w-52">
        <ComboboxInput placeholder="Filter areas" />
        <ComboboxContent>
          <ComboboxList aria-label="Areas">
            {AREAS.map((area) => (
              <ComboboxItem key={area} id={area}>
                {area}
              </ComboboxItem>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Row>
  ),

  field: () => (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="f-ok">With description</FieldLabel>
        <Input id="f-ok" placeholder="Anything" />
        <FieldDescription>Shown under the control.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="f-bad">With an error</FieldLabel>
        <Input id="f-bad" aria-invalid defaultValue="not valid" />
        <FieldError>This value is rejected.</FieldError>
      </Field>
    </div>
  ),
}
