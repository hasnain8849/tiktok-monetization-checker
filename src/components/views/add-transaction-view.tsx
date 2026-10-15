"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/mock-data";

const formSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  date: z.string().min(1, "Date is required"),
  merchant: z.string().min(1, "Merchant is required").max(80, "Too long"),
  category: z.string().min(1, "Select a category"),
  account: z.string().min(1, "Select an account"),
  notes: z.string().max(280, "Max 280 characters").optional(),
});

type FormValues = z.infer<typeof formSchema>;

const accounts = [
  "Chase Checking •4521",
  "Chase Savings •8830",
  "Amex Credit •1009",
];

const merchantSuggestions = [
  "Whole Foods Market",
  "Shell Gas Station",
  "Netflix",
  "Starbucks",
  "Amazon",
  "Costco",
  "Uber",
  "Salary Deposit",
];

export function AddTransactionView({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave?: () => void;
}) {
  const { toast } = useToast();
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [merchantOpen, setMerchantOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      merchant: "",
      category: "",
      account: accounts[0],
      notes: "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState } = form;
  const errors = formState.errors;
  const type = watch("type");
  const merchant = watch("merchant");

  const onSubmit = (values: FormValues) => {
    toast({
      title: "Transaction saved",
      description: `$${values.amount} ${values.type} for ${values.merchant}`,
    });
    onSave?.();
    onClose();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Add transaction
          </h1>
          <p className="text-sm text-muted-foreground">
            Record a new income, expense, or transfer
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-2 space-y-6"
        >
          <Card className="border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
              <CardDescription>Tell us about this transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) =>
                    setValue("type", v as FormValues["type"], {
                      shouldValidate: true,
                    })
                  }
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    {
                      key: "expense",
                      label: "Expense",
                      icon: ArrowDownLeft,
                      color: "text-red-600",
                    },
                    {
                      key: "income",
                      label: "Income",
                      icon: ArrowUpRight,
                      color: "text-teal-600",
                    },
                    {
                      key: "transfer",
                      label: "Transfer",
                      icon: ArrowRightLeft,
                      color: "text-blue-600",
                    },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const checked = type === opt.key;
                    return (
                      <label
                        key={opt.key}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-md border py-3 cursor-pointer transition-colors",
                          checked
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <RadioGroupItem
                          value={opt.key}
                          className="sr-only"
                        />
                        <Icon className={cn("h-5 w-5", opt.color)} />
                        <span className="text-sm font-medium">{opt.label}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {errors.type && (
                  <p className="text-xs text-red-600">{errors.type.message}</p>
                )}
              </div>

              {/* Amount + Date */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7 text-lg font-semibold tabular-nums"
                      {...register("amount")}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs text-red-600">
                      {errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" {...register("date")} />
                  {errors.date && (
                    <p className="text-xs text-red-600">{errors.date.message}</p>
                  )}
                </div>
              </div>

              {/* Merchant + Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input
                    id="merchant"
                    placeholder="Whole Foods Market"
                    autoComplete="off"
                    {...register("merchant")}
                    onFocus={() => setMerchantOpen(true)}
                    onBlur={() => setTimeout(() => setMerchantOpen(false), 100)}
                  />
                  {merchantOpen && merchant && (
                    <ul className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-48 overflow-auto">
                      {merchantSuggestions
                        .filter((m) =>
                          m.toLowerCase().includes(merchant.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((m) => (
                          <li key={m}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setValue("merchant", m, {
                                  shouldValidate: true,
                                });
                                setMerchantOpen(false);
                              }}
                            >
                              {m}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                  {errors.merchant && (
                    <p className="text-xs text-red-600">
                      {errors.merchant.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    onValueChange={(v) =>
                      setValue("category", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-red-600">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Account */}
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  defaultValue={accounts[0]}
                  onValueChange={(v) =>
                    setValue("account", v, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account && (
                  <p className="text-xs text-red-600">
                    {errors.account.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add context — e.g. shared dinner with friends"
                  rows={3}
                  {...register("notes")}
                />
                {errors.notes && (
                  <p className="text-xs text-red-600">{errors.notes.message}</p>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            setTags(tags.filter((x) => x !== t))
                          }
                          className="ml-1 hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white">
              <Check className="h-4 w-4" />
              Save transaction
            </Button>
          </div>
        </form>

        {/* Sidebar tips */}
        <Card className="border-border shadow-none h-fit">
          <CardHeader>
            <CardTitle className="text-base">Tips</CardTitle>
            <CardDescription>Make your records more useful</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Categorize correctly</p>
              <p className="mt-0.5">
                Categories power your spending analytics — pick the most specific
                one.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Use tags for events</p>
              <p className="mt-0.5">
                Tags like <span className="font-mono text-xs">vacation</span> or{" "}
                <span className="font-mono text-xs">recurring</span> make it easy
                to filter later.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Add notes</p>
              <p className="mt-0.5">
                A short note helps you recall the context when reviewing past
                months.
              </p>
            </div>
            <div className="rounded-md border border-teal-200 bg-teal-50 dark:bg-teal-950 dark:border-teal-800 p-3">
              <p className="text-xs text-teal-700 dark:text-teal-300">
                ✱ Auto-categorization will learn from your patterns over time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
