/**
 * Splits a filename into basename and extension.
 * Example: "image.png" -> { basename: "image", extension: ".png" }
 * Example: "archive.tar.gz" -> { basename: "archive.tar", extension: ".gz" }
 * Example: "no-extension" -> { basename: "no-extension", extension: "" }
 */
export const splitFileName = (filename: string): { basename: string; extension: string } => {
  if (!filename) return { basename: '', extension: '' };
  
  const lastDotIndex = filename.lastIndexOf('.');
  
  // No dot or dot at the beginning (.gitignore)
  if (lastDotIndex <= 0) {
    return { basename: filename, extension: '' };
  }
  
  return {
    basename: filename.substring(0, lastDotIndex),
    extension: filename.substring(lastDotIndex)
  };
};

/**
 * Reconstructs a filename from basename and extension.
 */
export const joinFileName = (basename: string, extension: string): string => {
  return `${basename}${extension}`;
};
