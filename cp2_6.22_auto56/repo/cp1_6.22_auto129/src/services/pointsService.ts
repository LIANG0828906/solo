export const calculateSignInPoints = (): number => {
  return 10;
};

export const calculatePhotoPoints = (photoCount: number = 1): number => {
  return photoCount * 3;
};

export const calculateCommentPoints = (): number => {
  return 5;
};
