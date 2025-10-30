export async function uploadImagesToDropbox(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    try {
      const base64 = await fileToBase64(file);
      uploadedUrls.push(base64);
    } catch (error) {
      console.error('Failed to convert image:', error);
      throw new Error(`Failed to process image: ${file.name}`);
    }
  }

  return uploadedUrls;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
