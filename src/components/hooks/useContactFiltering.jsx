export const useContactFiltering = (contacts) => {
  const filterContacts = (query, role) => {
    return contacts.filter(contact => {
      const nameMatches = `${contact.firstName} ${contact.lastName}`
        .toLowerCase()
        .includes(query.toLowerCase());
      
      const roleMatches = 
        !role || 
        role === 'all' || 
        contact.role === role;
      
      return nameMatches && roleMatches;
    });
  };

  return {
    filterContacts
  };
};