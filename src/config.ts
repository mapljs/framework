let _hydrateDependency = true;

export const hydrateDependency = (): boolean => _hydrateDependency;
export const noHydrateDependency = (): void => {
  _hydrateDependency = false;
}
