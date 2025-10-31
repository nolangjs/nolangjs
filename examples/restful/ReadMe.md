# Creating a RESTful API with Nolang

## Introduction
In this tutorial, we will build a simple RESTful API for managing books using Nolang. We'll define the data schema for a book, set up HTTP endpoints for CRUD operations, and create a user-friendly frontend using HTML and Bootstrap to interact with the API.

## Prerequisites
- Basic understanding of RESTful APIs
- Familiarity with JSON and HTML
- Nolang executable installed on your machine (Windows or Linux)
- MongoDB installed and running locally

## Project Setup

### Step 1: Set Up Your Nolang Project
1. Create a new directory for your project:
    ```sh
    mkdir nolang-restful-api
    cd nolang-restful-api
    ```

2. Create a file named `app.json` with the following content:
    ```json
    {
        "name": "RESTful API Sample",
        "schemas": [
            {
                "$id": "book",
                "properties": {
                    "Title": { "type": "string", "minLength": 1 },
                    "Author": { "type": "string", "minLength": 5 },
                    "PublishedDate": { "type": "date" },
                    "Summary": {
                        "type": "string",
                        "minLength": 20,
                        "maxLength": 200
                    }
                },
                "required": ["Title", "Author", "PublishedDate"]
            }
        ],
        "storage": {
            "adapter": "mongodb",
            "url": "mongodb://localhost:27017",
            "database": "nolangtest",
            "id": "_id"
        },
        "endpoints": [
            {
                "type": "http",
                "port": 3000,
                "static": "./public",
                "routes": [
                    {
                        "path": "/book/list",
                        "method": "get",
                        "return": {
                            "$$schema": "book",
                            "$$header": {
                                "action": "R"
                            }
                        }
                    },
                    {
                        "path": "/book/:id",
                        "method": "get",
                        "return": {
                            "$$schema": "book",
                            "$$header": {
                                "action": "R",
                                "filter": {
                                    "$$objid": "{{env.request.params.id}}"
                                }
                            }
                        }
                    },
                    {
                        "path": "/book/create",
                        "method": "post",
                        "bodyParser": "urlencoded",
                        "return": {
                            "$$schema": "book",
                            "$$header": {
                                "action": "C"
                            },
                            "Title": "{{env.request.body.Title}}",
                            "Author": "{{env.request.body.Author}}",
                            "PublishedDate": "{{env.request.body.PublishedDate}}",
                            "Summary": "{{env.request.body.Summary}}"
                        }
                    },
                    {
                        "path": "/book/update/:id",
                        "method": "put",
                        "bodyParser": "urlencoded",
                        "return": {
                            "$$schema": "book",
                            "$$header": {
                                "action": "U",
                                "filter": {
                                    "$$objid": "{{env.request.params.id}}"
                                }
                            },
                            "Title": "{{env.request.body.Title}}",
                            "Author": "{{env.request.body.Author}}",
                            "PublishedDate": "{{env.request.body.PublishedDate}}",
                            "Summary": "{{env.request.body.Summary}}"
                        }
                    },
                    {
                        "path": "/book/delete/:id",
                        "method": "delete",
                        "return": {
                            "$$schema": "book",
                            "$$header": {
                                "action": "D",
                                "filter": {
                                    "$$objid": "{{env.request.params.id}}"
                                }
                            }
                        }
                    }
                ]
            }
        ]
    }

    ```

3. Create a `public` directory and add a file named `index.html` with the following content:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Book Management App</title>
        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
            body {
                padding: 20px;
            }
            table {
                margin-top: 20px;
            }
            form {
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
    <div class="container">
        <h1 class="text-center">Book Management App</h1>
    
        <!-- Create Book Form -->
        <form id="createBookForm" class="mb-4">
            <h2>Create a New Book</h2>
            <div class="form-group">
                <label for="createTitle">Title:</label>
                <input type="text" id="createTitle" name="Title" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="createAuthor">Author:</label>
                <input type="text" id="createAuthor" name="Author" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="createPublishedDate">Published Date:</label>
                <input type="date" id="createPublishedDate" name="PublishedDate" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="createSummary">Summary:</label>
                <textarea id="createSummary" name="Summary" class="form-control" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Create Book</button>
        </form>
    
        <!-- Update Book Form -->
        <form id="updateBookForm" class="mb-4" style="display: none;">
            <h2>Update a Book</h2>
            <input type="hidden" id="updateId" name="id">
            <div class="form-group">
                <label for="updateTitle">Title:</label>
                <input type="text" id="updateTitle" name="Title" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="updateAuthor">Author:</label>
                <input type="text" id="updateAuthor" name="Author" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="updatePublishedDate">Published Date:</label>
                <input type="date" id="updatePublishedDate" name="PublishedDate" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="updateSummary">Summary:</label>
                <textarea id="updateSummary" name="Summary" class="form-control" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update Book</button>
            <button type="button" class="btn btn-secondary" onclick="cancelUpdate()">Cancel</button>
        </form>
    
        <!-- List of Books -->
        <h2>List of Books</h2>
        <table id="bookTable" class="table table-striped">
            <thead>
            <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Published Date</th>
                <th>Summary</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <!-- Books will be dynamically added here -->
            </tbody>
        </table>
    </div>
    
    <!-- Bootstrap JS, Popper.js, and jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    
    <script>
        const bookTable = document.getElementById('bookTable').getElementsByTagName('tbody')[0];
        const createBookForm = document.getElementById('createBookForm');
        const updateBookForm = document.getElementById('updateBookForm');
    
        // Fetch and display books
        async function fetchBooks() {
            const response = await fetch('/book/list');
            const books = await response.json();
            bookTable.innerHTML = '';
            books.forEach(book => {
                const row = bookTable.insertRow();
                row.innerHTML = `
                    <tr>
                        <td>${book.Title}</td>
                        <td>${book.Author}</td>
                        <td>${book.PublishedDate}</td>
                        <td>${book.Summary}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editBook('${book.$$objid}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBook('${book.$$objid}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
        }
    
        // Create book
        createBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createBookForm);
            const response = await fetch('/book/create', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });
            if (response.ok) {
                fetchBooks();
                createBookForm.reset();
            }
        });
    
        // Edit book
        async function editBook(id) {
            const response = await fetch(`/book/${id}`);
            const books = await response.json();
            const book = books[0];
            document.getElementById('updateId').value = book.$$objid;
            document.getElementById('updateTitle').value = book.Title;
            document.getElementById('updateAuthor').value = book.Author;
            document.getElementById('updatePublishedDate').value = book.PublishedDate;
            document.getElementById('updateSummary').value = book.Summary;
            createBookForm.style.display = 'none';
            updateBookForm.style.display = 'block';
        }
    
        // Update book
        updateBookForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('updateId').value;
            const formData = new FormData(updateBookForm);
            const response = await fetch(`/book/update/${id}`, {
                method: 'PUT',
                body: new URLSearchParams(formData)
            });
            if (response.ok) {
                fetchBooks();
                updateBookForm.reset();
                updateBookForm.style.display = 'none';
                createBookForm.style.display = 'block';
            }
        });
    
        // Cancel update
        function cancelUpdate() {
            updateBookForm.reset();
            updateBookForm.style.display = 'none';
            createBookForm.style.display = 'block';
        }
    
        // Delete book
        async function deleteBook(id) {
            const response = await fetch(`/book/delete/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchBooks();
            }
        }
    
        // Initial fetch of books
        fetchBooks();
    </script>
    </body>
    </html>

    ```

### Step 2: Run Your Nolang Project
Use the Nolang executable to run your project:
```sh
nolang run app.json
```

This will start your Nolang server on port 3000, as specified in the `app.json` file.

## Understanding Endpoint Routes and the Return Key
The `app.json` file defines the HTTP endpoints for your API. Each endpoint specifies the following keys:

- **Path**: The URL pattern for the endpoint.
- **Method**: The HTTP method (GET, POST, PUT, DELETE) used for the endpoint.
- **BodyParser**: (Optional) Specifies how the request body should be parsed. Common values are "urlencoded" or "json".
- **Return**: The configuration for what data to return and how to process it.

### Example Endpoint Route
```json
{
    "path": "/book/create",
    "method": "post",
    "bodyParser": "urlencoded",
    "return": {
        "$$schema": "book",
        "$$header": {
            "action": "C"
        },
        "Title": "{{env.request.body.Title}}",
        "Author": "{{env.request.body.Author}}",
        "PublishedDate": "{{env.request.body.PublishedDate}}",
        "Summary": "{{env.request.body.Summary}}"
    }
}
```

### Breakdown of the Return Key
- **$$schema**: Specifies the schema to use for the data. In this case, it's the "book" schema.
- **$$header**: Contains metadata about the action to perform. `"action": "C"` indicates a create action.
- **Other fields (Title, Author, etc.)**: These fields map the incoming request data to the schema properties.

### Common Actions in Return Header
- **C (Create)**: Create a new entry in the database.
- **R (Read)**: Retrieve data from the database.
- **U (Update)**: Update an existing entry in the database.
- **D (Delete)**: Remove an entry from the database.

## Using the Frontend

### Create a Book
1. Open your browser and navigate to `http://localhost:3000`.
2. Fill out the "Create a New Book" form with the book details.
3. Click the "Create Book" button to add the book to the database.

### List Books
1. The list of books will be displayed under the "List of Books" section.
2. Each book entry will have "Edit" and "Delete" buttons for further actions.

### Update a Book
1. Click the "Edit" button next to the book you want to update.
2. The book details will be populated in the "Update a Book" form.
3. Make the necessary changes and click the "Update Book" button to save the changes.
4. Click the "Cancel" button to return to the book creation form.

### Delete a Book
1. Click the "Delete" button next to the book you want to remove.
2. The book will be deleted from the database and removed from the list.

## Using Postman to Test Endpoints

Postman is a popular tool used to test and interact with APIs. Here's how you can use Postman to test the endpoints of your RESTful API.

### Step 1: Download and Install Postman
1. Download Postman from the official [Postman website](https://www.postman.com/downloads/).
2. Install Postman on your computer.

### Step 2: Test Endpoints

#### Test the Create Endpoint
1. Open Postman and create a new POST request.
2. Set the URL to `http://localhost:3000/book/create`.
3. Under the "Body" tab, select "x-www-form-urlencoded".
4. Add the following key-value pairs:
    - `Title`: (Enter a book title)
    - `Author`: (Enter the author's name)
    - `PublishedDate`: (Enter the published date in YYYY-MM-DD format)
    - `Summary`: (Enter a summary of the book)
5. Click the "Send" button to create a new book entry.

#### Test the List Endpoint
1. Create a new GET request.
2. Set the URL to `http://localhost:3000/book/list`.
3. Click the "Send" button to retrieve the list of books.

#### Test the Update Endpoint
1. Create a new PUT request.
2. Set the URL to `http://localhost:3000/book/update/{id}` (Replace `{id}` with the ID of the book you want to update).
3. Under the "Body" tab, select "x-www-form-urlencoded".
4. Add the key-value pairs with the updated book information.
5. Click the "Send" button to update the book entry.

#### Test the Delete Endpoint
1. Create a new DELETE request.
2. Set the URL to `http://localhost:3000/book/delete/{id}` (Replace `{id}` with the ID of the book you want to delete).
3. Click the "Send" button to delete the book entry.


## Conclusion
In this tutorial, we built a RESTful API for managing books using Nolang. We defined the data schema, set up HTTP endpoints for CRUD operations, and created a frontend to interact with the API. Feel free to explore additional features and improvements to enhance the application further.


