import type { UploadFile } from "antd/es/upload/interface";
import { createContext, ReactNode, useCallback, useState } from "react";

export type ConfigType = {
  mode: "vertical" | "horizontal" | "multipleColumns";
  spacing: 0 | 1;
  width: number;
  height: number;
} & ({ border: 1; borderWidth: number } | { border: 0; borderWidth?: never }) &
  (
    | { mode: "multipleColumns"; columns: number }
    | { mode: "vertical" | "horizontal"; columns?: never }
  );

export const defaultConfig: ConfigType = {
  mode: "vertical",
  spacing: 0,
  border: 0,
  width: 300,
  height: 300,
};

interface ImageContextProps {
  images: UploadFile[];
  setImages: (value: UploadFile[]) => void;
  config: ConfigType;
  setConfig: (value: ConfigType) => void;
}

const ImageContext = createContext<ImageContextProps | undefined>(undefined);

interface Props {
  children: ReactNode;
}

const STORAGE_CONFIG_KEY = "@image-mixed/config";

export function ImageContextWrapper({ children }: Props) {
  const [config, setConfig] = useState<ConfigType>(() => {
    const config = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!config) return defaultConfig;
    return JSON.parse(config);
  });
  const [images, setImages] = useState<UploadFile[]>([]);

  const setConfigToLocal = useCallback(
    (config: ConfigType & { images?: UploadFile[] }) => {
      if (config.images) delete config.images;
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
      setConfig(config);
    },
    [],
  );

  return (
    <ImageContext.Provider
      value={{ config, setConfig: setConfigToLocal, images, setImages }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export default ImageContext;
