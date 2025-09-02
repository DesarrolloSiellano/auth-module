export const filterAndSort = (form: any[]) => {
  return form
    .filter(item => item.show) // Filtra elementos donde show es true
    .map(item => ({ ...item, weight: item.weight ?? 0 })) // Asigna weight=0 si no tiene peso
    .sort((a, b) => a.weight - b.weight); // Ordena por weight de menor a mayor
};
