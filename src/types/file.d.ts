type FileType = "script" | "transaction" | "contract";

export interface AddressMap {
  [key: string]: string;
}

export type MaybeAddressMap = AddressMap | void;
