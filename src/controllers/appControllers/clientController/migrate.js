exports.migrate = (result) => {
  // people/company could be: a populated document OR a raw ObjectId
  // We check for typeof object to be safe
  const sub =
    result.type === 'people'
      ? (result.people && typeof result.people === 'object' && !result.people._bsontype
          ? result.people
          : null)
      : (result.company && typeof result.company === 'object' && !result.company._bsontype
          ? result.company
          : null);

  return {
    _id: result._id,
    type: result.type,
    name: result.name || '',
    enabled: result.enabled,
    source: result.source || '',
    category: result.category || '',
    notes: result.notes || '',
    people: result.people,
    company: result.company,
    // Extract contact fields from sub-doc, fall back to empty string
    phone: sub?.phone ?? '',
    email: sub?.email ?? '',
    website: sub?.website ?? '',
    country: sub?.country ?? '',
    address: sub?.address ?? '',
  };
};