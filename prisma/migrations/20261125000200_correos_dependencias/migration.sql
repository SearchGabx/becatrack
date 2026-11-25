BEGIN;
-- Apply the directory once so future deployments preserve administrator changes.
DO $$
DECLARE
  entry record;
  dep_id text;
  user_id text;
  alias_row record;
BEGIN
  FOR entry IN SELECT * FROM (VALUES
    ('Aldair', 'amartine75@cuc.edu.co'),
    ('Alex Castro', 'acastro10@cuc.edu.co'),
    ('Amaira Corrales', 'acorrale@cuc.edu.co'),
    ('Ana Carolina Torregroza', 'atorregr4@cuc.edu.co'),
    ('Ana María Echeverría', 'aecheverria@cuc.edu.co'),
    ('Anderson Vergara', 'anvergaraj@cuc.edu.co'),
    ('Angie Guerra', 'angie@crissien.com'),
    ('Atenas Gutiérrez', 'agutierr75@cuc.edu.co'),
    ('Autoevaluación', 'avalle2@cuc.edu.co'),
    ('Beliña Herrera', 'bherrera3@cuc.edu.co'),
    ('Benjamín Lizarazo', 'blizarazo@cuc.edu.co'),
    ('Biblioteca', 'dbarake@cuc.edu.co'),
    ('Bienestar CUL', 'kmarunh@ul.edu.co'),
    ('Camilo Silvera', 'crada6@cuc.edu.co'),
    ('Claudia Ramírez', 'cramirez2@cuc.edu.co'),
    ('CUC University', 'jordonez3@cuc.edu.co'),
    ('David Blanco', 'dblanco6@cuc.edu.co'),
    ('Diana Jiménez', 'djimenez8@cuc.edu.co'),
    ('Diana Pinto', 'dpinto3@cuc.edu.co'),
    ('Diva Mendoza', 'dmendoza32@cuc.edu.co'),
    ('Francisco Ripoll', 'fripoll1@cuc.edu.co'),
    ('Gina Pérez', 'gperez7@cuc.edu.co'),
    ('Irmina Hernandez', 'ihernand8@cuc.edu.co'),
    ('Jarley de Ávila', 'jdeavila14@cuc.edu.co'),
    ('Javier Moreno', 'jjmorenoj@cuc.edu.co'),
    ('Joyce Montero', 'jmontero16@cuc.edu.co'),
    ('Karol Cubides', 'kcubides1@cuc.edu.co'),
    ('Kateryn Bonett', 'kbonett1@cuc.edu.co'),
    ('Keidy García', 'kgarcia6@cuc.edu.co'),
    ('Laboratorios (Ricardo Mendoza)', 'rmendoza13@cuc.edu.co'),
    ('Lina Navarrete', 'lnavarre1@cuc.edu.co'),
    ('Lisset Vásquez', 'lvasquez8@cuc.edu.co'),
    ('Luis Alvear', 'lalvear1@cuc.edu.co'),
    ('Luis Díaz', 'ldiaz28@cuc.edu.co'),
    ('Marla Villareal', 'mvillarr4@cuc.edu.co'),
    ('Martha Benítez', 'mbenitez9@cuc.edu.co'),
    ('Michell Murillo', 'mmurillo4@cuc.edu.co'),
    ('Milen Balbis', 'mbalbis1@cuc.edu.co'),
    ('Natalia González Auque', 'ngonzale22@cuc.edu.co'),
    ('Opción Atlántico', 'atlanticounicosta@cuc.edu.co'),
    ('Vanessa Rada', 'vrada1@cuc.edu.co'),
    ('Vivian Maury', 'vmaury1@cuc.edu.co'),
    ('Yadira Marín', 'ymarin3@cuc.edu.co'),
    ('Yulineth Gómez', 'ygomez6@cuc.edu.co'),
    ('Carol Durant', 'cdurant@cuc.edu.co'),
    ('Sebastián Támara', 'stamarad@cuc.edu.co'),
    ('Comunicaciones CUC', 'comunicaciones@cuc.edu.co'),
    ('Carlos Cervantes', 'ccervant11@cuc.edu.co'),
    ('Diana Varela', 'dvarela4@cuc.edu.co'),
    ('Freddy Marín', 'fmarin1@cuc.edu.co'),
    ('Inirida Avendaño', 'iavendano@cuc.edu.co'),
    ('Isamar Gutiérrez', 'igutierr13@cuc.edu.co'),
    ('Karol Martínez', 'kmartine8@cuc.edu.co'),
    ('Jassier Cervantes', 'jcervant11@cuc.edu.co'),
    ('Zarzuela', 'zarzuela@cuc.edu.co'),
    ('Kelly Coronado', 'kcoronad@cuc.edu.co'),
    ('Leidy Pérez Coronell (Dir. Educosta)', 'lperez70@cuc.edu.co'),
    ('Linda Catalán', 'lcatalan@cuc.edu.co'),
    ('Liney Manjarrés', 'lmanjarres@cuc.edu.co'),
    ('Lissete Cuello', 'lcuello9@cuc.edu.co'),
    ('Mayra Céspedes', 'mcespede@cuc.edu.co'),
    ('Paola Orellano', 'porellan3@cuc.edu.co'),
    ('Samuel Padilla', 'spadilla13@cuc.edu.co'),
    ('Yefferson Gomez', 'ygomez22@cuc.edu.co'),
    ('Zhoe Comas', 'zcomas1@cuc.edu.co'),
    ('Melissa Mendivil (Coord. Invest)', 'mmendivi1@cuc.edu.co')
  ) AS directory(nombre, correo) LOOP
    SELECT d.id, d."usuarioId" INTO dep_id, user_id FROM "Dependencia" d WHERE d.nombre = entry.nombre;
    IF dep_id IS NULL THEN
      dep_id := gen_random_uuid()::text;
      INSERT INTO "Dependencia"(id, nombre, responsable) VALUES (dep_id, entry.nombre, entry.nombre);
    END IF;
    FOR alias_row IN SELECT d.* FROM "Dependencia" d WHERE d.nombre = CASE entry.nombre
      WHEN 'Opción Atlántico' THEN 'Comunicaciones OPC'
      WHEN 'Yulineth Gómez' THEN 'Yulineth Gomez'
      WHEN 'Michell Murillo' THEN 'Michel Murillo'
      WHEN 'Natalia González Auque' THEN 'Natalia Gonzalez'
    END LOOP
      UPDATE "RegistroHoras" SET "dependenciaId" = dep_id WHERE "dependenciaId" = alias_row.id;
      DELETE FROM "Dependencia" WHERE id = alias_row.id;
      IF user_id IS NULL THEN
        user_id := alias_row."usuarioId";
      ELSIF alias_row."usuarioId" IS NOT NULL THEN
        DELETE FROM "Usuario" WHERE id = alias_row."usuarioId" AND rol = 'DEPENDENCIA';
      END IF;
    END LOOP;
    IF user_id IS NULL THEN
      user_id := gen_random_uuid()::text;
      INSERT INTO "Usuario"(id,nombre,email,"passwordHash",rol) VALUES
        (user_id,entry.nombre,NULL,'$2a$10$GYX3ZVU5KOmceMSZdzctgOJX/FCj68M2Zvk8kHYFH2UXkIDWr.KcS','DEPENDENCIA');
    ELSE
      UPDATE "Usuario" SET nombre=entry.nombre,email=NULL,"passwordHash"='$2a$10$GYX3ZVU5KOmceMSZdzctgOJX/FCj68M2Zvk8kHYFH2UXkIDWr.KcS'
        WHERE id=user_id AND rol='DEPENDENCIA';
      IF NOT FOUND THEN RAISE EXCEPTION 'Rol incompatible para %', entry.nombre; END IF;
    END IF;
    UPDATE "Dependencia" SET email=entry.correo,"usuarioId"=user_id WHERE id=dep_id;
  END LOOP;
END $$;
CREATE UNIQUE INDEX "Dependencia_correo_acceso" ON "Dependencia" (lower(email)) WHERE "usuarioId" IS NOT NULL;
COMMIT;
