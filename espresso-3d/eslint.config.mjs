import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  { ignores: [".next/**", ".next-production/**", "node_modules/**", "next-env.d.ts", "output/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
export default config;
