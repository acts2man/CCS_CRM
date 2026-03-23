import { base44 } from '@/api/base44Client';

export async function syncStudentsWithList() {
  // Master list of students from the provided data
  const masterList = [
    { first_name: 'Landon', last_name: 'Paterson' },
    { first_name: 'Leroy', last_name: 'Pena' },
    { first_name: 'Jacob', last_name: 'Palacios' },
    { first_name: 'Alana', last_name: 'Robey' },
    { first_name: 'Ricardo', last_name: 'Rivera' },
    { first_name: 'Ricardo', last_name: 'Robinson' },
    { first_name: 'Edwin', last_name: 'Rodriguez' },
    { first_name: 'Lina', last_name: 'Rodriguez' },
    { first_name: 'Jesus', last_name: 'Rodriguez Fitch' },
    { first_name: 'Amah', last_name: 'Romero' },
    { first_name: 'Keyden', last_name: 'Shreve' },
    { first_name: 'Savanah', last_name: 'Singleton' },
    { first_name: 'Shane', last_name: 'Singleton' },
    { first_name: 'Shanyah', last_name: 'Singleton' },
    { first_name: 'Aizsa', last_name: 'Siqued' },
    { first_name: 'Fabian', last_name: 'Thomas' },
    { first_name: 'Faith', last_name: 'Thomas' },
    { first_name: 'Phyllis', last_name: 'Thomas' },
    { first_name: 'Mireya', last_name: 'Taba' },
    { first_name: 'Mack', last_name: 'Tora' },
    { first_name: 'Sarina', last_name: 'Tzintzun' },
    { first_name: 'Kaila', last_name: 'Valencia' },
    { first_name: 'Kimberly', last_name: 'Valenzia' },
    { first_name: 'Zaires', last_name: 'Valley' },
    { first_name: 'Angelito', last_name: 'Vasquez' },
    { first_name: 'Jayden', last_name: 'Vigilance' },
    { first_name: 'Gianna Valentina', last_name: 'Vinyard' },
    { first_name: 'Kaelyn', last_name: 'Walker' },
    { first_name: 'Abigail', last_name: 'Wagala' },
    { first_name: 'Haninah', last_name: 'Wagala' },
    { first_name: 'Kyona', last_name: 'Washington' },
    { first_name: 'Lauren', last_name: 'Wells' },
    { first_name: 'Xinu', last_name: 'Williams' },
    { first_name: 'Jackson', last_name: 'Winton' },
    { first_name: 'Onia', last_name: 'Xiong' },
    { first_name: 'Asher', last_name: 'French' },
    { first_name: 'Leah', last_name: 'Gantz' },
    { first_name: 'Daniel', last_name: 'Garcia' },
    { first_name: 'Isabella', last_name: 'Garcia' },
    { first_name: 'Nayeli', last_name: 'Garcia' },
    { first_name: 'Lawrence', last_name: 'Gooding' },
    { first_name: 'Darins', last_name: 'Goodall' },
    { first_name: 'Lidia', last_name: 'Gutschewska' },
    { first_name: 'Layah', last_name: 'Haywood-Ricky' },
    { first_name: 'Makhalie', last_name: 'Horne' },
    { first_name: 'Maleakhi', last_name: 'Hicks' },
    { first_name: 'Elijah', last_name: 'Horne' },
    { first_name: 'Zoey', last_name: 'Horne' },
    { first_name: 'Tani', last_name: 'Huyapani' },
    { first_name: 'Isaiah', last_name: 'Jackson' },
    { first_name: 'Zander', last_name: 'Jackson' },
    { first_name: 'Jaison', last_name: 'Johnson' },
    { first_name: 'Kaizen', last_name: 'Johnson' },
    { first_name: 'Shaun', last_name: 'Joyce' },
    { first_name: 'Shane', last_name: 'Joyce' },
    { first_name: 'Hosanna', last_name: 'Kaliekt' },
    { first_name: 'Renel', last_name: 'Kaswell' },
    { first_name: 'Caleb', last_name: 'Lacatu' },
    { first_name: 'Jeremiah', last_name: 'Lee' },
    { first_name: 'Layla', last_name: 'Lewis' },
    { first_name: 'Ashley', last_name: 'Luke' },
    { first_name: 'Anna', last_name: 'Luke' },
    { first_name: 'Ava', last_name: 'Lucien' },
    { first_name: 'Emma', last_name: 'Lucien' },
    { first_name: 'Winston', last_name: 'Lucien' },
    { first_name: 'Darryl', last_name: 'Lucien III' },
    { first_name: 'Briana', last_name: 'Magnos' },
    { first_name: 'Myana', last_name: 'Mann' },
    { first_name: 'Mayzra', last_name: 'Matsuoka' },
    { first_name: 'Cierra', last_name: 'Mayzuka' },
    { first_name: 'Maleekh', last_name: 'McCoy' },
    { first_name: 'Anaiya', last_name: 'McKinney' },
    { first_name: 'Nadis', last_name: 'Medina' },
    { first_name: 'Eivo', last_name: 'Mendoza' },
    { first_name: 'Gilbert', last_name: 'Mendoza' },
    { first_name: 'Mahin', last_name: 'Merizal' },
    { first_name: 'Leanza', last_name: 'Miller' },
    { first_name: 'Tio', last_name: 'Mongalo' },
    { first_name: 'Zen', last_name: 'Mongalo' },
    { first_name: 'Natasha', last_name: 'Nathan' },
    { first_name: 'Briella', last_name: 'Navarro' },
    { first_name: 'Haylie', last_name: 'Newell' },
    { first_name: 'Denise', last_name: 'Palacios' },
    { first_name: 'London', last_name: 'Patterson' },
    { first_name: 'Legend', last_name: 'Agostinho' },
    { first_name: 'Liberty', last_name: 'Agostinho' },
    { first_name: 'Dionte', last_name: 'Allen' },
    { first_name: 'Dior', last_name: 'Allen' },
    { first_name: 'Antonio', last_name: 'Araujo' },
    { first_name: 'Latia', last_name: 'Arriaga' },
    { first_name: 'Susan', last_name: 'Arriaga' },
    { first_name: 'Aldara', last_name: 'Atrus' },
    { first_name: 'Mickel', last_name: 'Bailey' },
    { first_name: 'Dariella', last_name: 'Bates' },
    { first_name: 'Lora', last_name: 'Bell' },
    { first_name: 'Jasmin', last_name: 'Bent' },
    { first_name: 'Allie', last_name: 'Bigelow' },
    { first_name: 'Gracin', last_name: 'Boland' },
    { first_name: 'Atheena', last_name: 'Brown' },
    { first_name: 'Margaret', last_name: 'Bravatti' },
    { first_name: 'Violet', last_name: 'Camacho' },
    { first_name: 'Kailee', last_name: 'Camarena' },
    { first_name: 'Liberty', last_name: 'Camarenas' },
    { first_name: 'Celestina', last_name: 'Camargo' },
    { first_name: 'Javier', last_name: 'Castro' },
    { first_name: 'Jocelyn', last_name: 'Castro' },
    { first_name: 'Jollene', last_name: 'Castro' },
    { first_name: 'Matthew', last_name: 'Castro' },
  ];

  // Get all existing students
  const existingStudents = await base44.entities.Student.list('', 500);

  // Track students to delete
  const studentsToDelete = [];

  // Check each existing student
  for (const student of existingStudents) {
    const matchFound = masterList.some(
      master =>
        master.first_name.toLowerCase() === student.first_name?.toLowerCase() &&
        master.last_name.toLowerCase() === student.last_name?.toLowerCase()
    );

    if (!matchFound) {
      studentsToDelete.push(student);
    }
  }

  // Delete students not on the list
  for (const student of studentsToDelete) {
    await base44.entities.Student.delete(student.id);
  }

  return {
    deleted: studentsToDelete.length,
    kept: existingStudents.length - studentsToDelete.length,
    deletedNames: studentsToDelete.map(s => `${s.first_name} ${s.last_name}`)
  };
}