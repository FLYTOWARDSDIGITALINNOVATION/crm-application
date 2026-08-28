export const isDigitalMarketingEmployee = (user?: { designation?: string; department?: string } | null) => {
  const department = user?.department?.trim().toLowerCase();
  const designation = user?.designation?.trim().toLowerCase();

  if (designation && (designation.includes('editor') || designation.includes('designer') || designation.includes('developer'))) {
    return false;
  }

  return department === 'digital marketing' || department === 'telecalling';
};
