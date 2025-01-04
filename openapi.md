# Patient Microservice

> Version 1.0.0

Patient microservice for managing patient data within the Clinic Management System. Supports registration, retrieval, updating, and deletion of patient information.

## Path Table

| Method | Path | Description |
| --- | --- | --- |
| DELETE | [/deletePatient/{id}](#deletedeletepatientid) | Delete a patient |
| GET | [/getPatientById/{id}](#getgetpatientbyidid) | Retrieve a patient by ID |
| GET | [/obtainAll](#getobtainall) | Get all patients |
| POST | [/register](#postregister) | Register a new patient |
| PUT | [/updatePatient/{id}](#putupdatepatientid) | Update patient data |

## Reference Table

| Name | Path | Description |
| --- | --- | --- |
| Patient | [#/components/schemas/Patient](#componentsschemaspatient) |  |

## Path Details

***

### [DELETE]/deletePatient/{id}

- Summary  
Delete a patient

- Description  
Deletes a patient from the system using their unique ID.

#### Responses

- 204 Patient successfully deleted, no content returned

- 400 Invalid request - possible incorrect ID format

`application/json`

```ts
{
  // Error message related to the request
  message?: string
}
```

- 404 Patient not found - the provided ID does not match any patient

`application/json`

```ts
{
  // Details about the error in finding the patient
  message?: string
}
```

***

### [GET]/getPatientById/{id}

- Summary  
Retrieve a patient by ID

- Description  
Fetches detailed information of a specific patient by their unique ID.

#### Responses

- 200 Patient successfully retrieved

`application/json`

```ts
{
  // Unique ID of the patient
  _id?: string
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // Patient's national identification number
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}
```

- 404 Patient not found - the provided ID does not match any patient

`application/json`

```ts
{
  // Error message indicating patient not found
  message?: string
}
```

- 500 Error retrieving patient - server error or issue with the database

`application/json`

```ts
{
  // Error message providing details about the server error
  message?: string
}
```

***

### [GET]/obtainAll

- Summary  
Get all patients

- Description  
Retrieves a complete list of all patients registered in the system.

#### Responses

- 200 Patient list successfully retrieved

`application/json`

```ts
{
  // Unique ID of the patient
  _id?: string
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // Patient's national identification number
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}[]
```

- 500 Internal error when retrieving patient list

`application/json`

```ts
{
  // Error message with additional details
  message?: string
}
```

***

### [POST]/register

- Summary  
Register a new patient

- Description  
Creates and saves a new patient in the database, assigning them a unique medical history ID.

#### RequestBody

- application/json

```ts
{
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // National identification number of the patient
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}
```

#### Responses

- 201 Patient successfully created

`application/json`

```ts
{
  // Unique ID of the patient
  _id?: string
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // Patient's national identification number
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}
```

- 400 Invalid request - may lack required data or have incorrect format

`application/json`

```ts
{
  // Details about the error in the request
  message?: string
}
```

***

### [PUT]/updatePatient/{id}

- Summary  
Update patient data

- Description  
Updates the information of an existing patient using their unique ID.

#### RequestBody

- application/json

```ts
{
  // New name of the patient
  name?: string
  // New surname of the patient
  surname?: string
  // New date of birth in YYYY-MM-DD format
  birthdate?: string
  // Updated identification number of the patient
  dni?: string
  // New city of residence of the patient
  city?: string
}
```

#### Responses

- 200 Patient successfully updated

`application/json`

```ts
{
  // Unique ID of the patient
  _id?: string
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // Patient's national identification number
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}
```

- 400 Error updating patient - possible invalid data format or missing fields

`application/json`

```ts
{
  // Details about the update error
  message?: string
}
```

- 404 Patient not found - the provided ID does not match any patient

`application/json`

```ts
{
  // Details about the error in finding the patient
  message?: string
}
```

## References

### #/components/schemas/Patient

```ts
{
  // Unique ID of the patient
  _id?: string
  // Patient's first name
  name?: string
  // Patient's last name
  surname?: string
  // Patient's date of birth in YYYY-MM-DD format
  birthdate?: string
  // Patient's national identification number
  dni?: string
  // City of residence of the patient
  city?: string
  // Username for the patient's access to the system
  username?: string
  // Password for the patient's access to the system
  password?: string
  // Patient's email for communication and account recovery
  email?: string
}
```