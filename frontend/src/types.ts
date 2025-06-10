// book type definition matching the go backend output
export type book = {
  id: string;
  title: string;
  author: string;
  filePath: string;
  coverPath: string;
  description: string;
  format: string;
  addedAt: string;
  lastOpenedAt: string;
};
