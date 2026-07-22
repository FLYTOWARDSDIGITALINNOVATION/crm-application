export const isDigitalMarketingEmployee = (user?: { designation?: string; department?: string } | null) => {
  const department = user?.department?.trim().toLowerCase();
  return department === 'digital marketing';
};
