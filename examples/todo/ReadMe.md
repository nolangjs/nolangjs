# Creating a ToDo App with Nolang

In this tutorial, we'll create a simple ToDo app using Nolang. We'll cover setting up the project, defining the schema, configuring the endpoints, and creating a basic front-end to interact with the app.

### Prerequisites

Before you start, make sure you have the following installed on your machine:
- [Nolang](https://nolang.org)
- A code editor (e.g., VS Code)

### Step 1: Set Up the Project

Create a new directory for your project and navigate into it:
```bash
mkdir todo-app
cd todo-app
```

### Step 2: Define the App Configuration

Create a file named `app.json5` and define the schema for the ToDo items, storage configuration, and endpoints:

```json5
{
  name: "ToDo sample app",
  schemas: [
    {
      "$id": "todo",
      "type": "object",
      "properties": {
        "who": {
          "type": "string",
          "title": "Doer of Task"
        },
        "what": {
          "type": "string",
          "title": "What to do"
        },
        "done": {
          "type": "boolean",
          "title": "Is done?",
          "default": false
        }
      },
      "required": ["who", "what"]
    }
  ],
  storage: {
    adapter: "json",
    path: "data/todos.json"
  },
  endpoints: [
    {
      type: 'http',
      static: './public',
      port: 1000,
      routes: [
        {
          path: '/',
          method: 'post'
        }
      ]
    }
  ]
}
```

### Step 3: Create the Data Directory

Create a directory named `data` and an empty JSON file to store the ToDo items:

```bash
mkdir data
echo "{\"todo\": []}" > data/todos.json
```

### Step 4: Create the Front-end

Create a directory named `public` and an `index.html` file inside it. This file will serve as the front-end for interacting with the ToDo app:

```html
<!DOCTYPE HTML>
<html>
<head>
    <title>ToDo by Nolang</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container p-5">
    <h1>ToDo List</h1>
    <table class="table">
        <thead>
        <tr>
            <th>Id</th>
            <th>Who</th>
            <th>What</th>
            <th>Done</th>
        </tr>
        </thead>
        <tbody id="todolist"></tbody>
    </table>
    <div>
        <button class="btn btn-danger float-end" onclick="clearTodos()">Clear</button>
        <fieldset class="border p-4 bg-light mt-4">
            <legend>Add ToDo</legend>
            <input id="who" class="form-control mb-2" placeholder="Who">
            <input id="what" class="form-control mb-2" placeholder="What">
            <button class="btn btn-primary float-end" onclick="addTodo()">Add</button>
        </fieldset>
    </div>
</div>

<script type="text/javascript">
    function send(command) {
        return fetch('/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(command)
        }).then(res => res.json());
    }

    const todolist = document.getElementById('todolist');

    function addToDoToTable(todo) {
        const newRow = todolist.insertRow();
        newRow.insertCell().innerText = todo.$$objid;
        newRow.insertCell().innerText = todo.who;
        newRow.insertCell().innerText = todo.what;
        newRow.insertCell().innerHTML = `<input type="checkbox" ${todo.done ? 'checked' : ''} onclick="doneTodo(this, '${todo.$$objid}')">`;
    }

    function addTodo() {
        send({
            $$schema: 'todo',
            $$header: {
                action: 'C'
            },
            who: document.getElementById('who').value,
            what: document.getElementById('what').value
        }).then(res => {
            addToDoToTable(res);
        });
    }

    function loadTodos() {
        send({
            $$schema: 'todo',
            $$header: {
                action: 'R'
            }
        }).then(res => {
            todolist.innerHTML = '';
            res.forEach(todo => {
                addToDoToTable(todo);
            });
        });
    }

    function doneTodo(t, todoid) {
        send({
            $$schema: 'todo',
            $$header: {
                action: 'U',
                filter: {
                    $$objid: todoid
                }
            },
            done: t.checked
        });
    }

    function clearTodos() {
        send({
            $$schema: 'todo',
            $$header: {
                action: 'D',
                filter: {
                    done: true
                }
            }
        }).then(() => {
            loadTodos();
        });
    }

    loadTodos();
</script>
</body>
</html>
```

### Step 5: Run the App

Start the Nolang app with the following command:
```bash
nolang app.json5
```

### Step 6: Open the App in a Browser

Navigate to `http://localhost:1000` in your web browser. You should be able to add, view, update, and delete todos using the interface provided in `index.html`.

### Explanation of Nolang Scripts and JSON Payloads

Nolang app configuration defines the app schema, storage, and endpoints.

1. **Schema Definition**:
    - `$id`: Identifier for the schema.
    - `type`: The data type (object in this case).
    - `properties`: The fields for the schema.
    - `required`: Mandatory fields.

2. **Storage Configuration**:
    - `adapter`: The storage method (JSON file in this case).
    - `path`: The path to the storage file.

3. **Endpoints**:
    - `type`: The type of endpoint (HTTP in this case).
    - `static`: The directory for static files.
    - `port`: The port number for the server.
    - `cors`: Cross-origin resource sharing configuration.
    - `routes`: The HTTP routes.

### JSON Payloads for CRUD Operations

1. **Create (C)**: Add a new todo item.

   ```json
   {
     "$$schema": "todo",
     "$$header": {
       "action": "C",
       "debug": true
     },
     "who": "John Doe",
     "what": "Finish writing report",
     "done": false
   }
   ```

2. **Read (R)**: Retrieve todo items.

   ```json
   {
     "$$schema": "todo",
     "$$header": {
       "action": "R",
       "debug": true
     }
   }
   ```

3. **Update (U)**: Update a todo item.

   ```json
   {
     "$$schema": "todo",
     "$$header": {
       "action": "U",
       "debug": true,
       "filter": {
         "$$objid": "12345"
       }
     },
     "done": true
   }
   ```

4. **Delete (D)**: Delete completed todo items.

   ```json
   {
     "$$schema": "todo",
     "$$header": {
       "action": "D",
       "filter": {
         "done": true
       }
     }
   }
   ```

### Conclusion

You have now created a simple ToDo app using Nolang. This tutorial covered setting up the project, defining the schema, configuring endpoints, and creating a basic front-end. Feel free to enhance the app by adding more features or customizing it to fit your needs.

If you have any questions or need further assistance, feel free to ask! 😊

Happy coding! 🎉
