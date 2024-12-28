module.exports.sortLocale = (array) =>
  array.sort((a, b) =>
    a.toString().localeCompare(b, undefined, { sensitivity: "base" })
  );

module.exports.sortNumericStrings = (array) =>
  array.sort((a, b) => {
    const aNum = Number(a.replace(/[^\d]/g, ""));
    const bNum = Number(b.replace(/[^\d]/g, ""));
    return aNum - bNum;
  });
