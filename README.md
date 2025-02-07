<p align="center">
  <img src="https://nolang.org/img/nolangtlogo.png" width="350" title="Nolang" alt="Nolang">
</p>

# Share Your Feedback 
We value your input! If you have suggestions, issues, or comments about our package, please don't hesitate to reach out. Your feedback helps us improve. You can connect us with info[@]nolang.org.


# What is Nolang

Nolang is a new programming language and can be used as a nodejs framework. In Nolang, everything is defined with JSON syntax, and code functions similarly to data. Programmers only need to define the entities when create programs with Nolang.

### Usage of Nolang
Nolang is well-suited for developing back-end services, RESTful APIs, microservices, and even front-end applications.

### Website
The official website of Nolang is https://nolang.org that includes documents.

### Syntax
Syntax of Nolang is JSON only. For to be more easy it is possible to write with JSON5.

### Describing entities
In NoLang, Entities are defined with JSON Schema plus some specific keywords added by NoLang.

The schema of an entity in its simplest format can be like this:
```json 
{
	"$id": "entity-schema-id",
	"properties": {
		"FieldName1": {
			"type": "string"
		},
		"FieldName2": {
			"type": "number"
		}
	}
}
```

### Manipulating data in entities
When we want to ask from a NoLang program to do something, we must use NoLang Scripts. 
```json 
{
	"$$schema": "entity-schema-id",
	"$$header": {
		"action": "C"
	},
	"FieldName1": "Hello",
	"FieldName2": 25
}
```
## NoLang Endpoints
NoLang Endpoints are the ways To connect and send a Script to a NoLang app. Several types of endpoints are supported for example http, socket, ipc, redis and very more.



# Nolang Application
Structure of a Nolang application is very Straightforward.

## Structure of a NoLang app

<p align="center">
  <img src="https://nolang.org/img/nolang-structure4.png" width="60%" title="Nolang" alt="Nolang">
</p>

- In every NoLang app there are some entities.
- It must be defined the entities' schemas in config file or in separate files.
- If this app stores data of entities the storage configuration must be defined in any schema or config file.
- It is necessary to define one or more endpoints that this app listens to.
- If this app needs to connect to other NoLang apps it can be defined in microservice configuration.

## Application config file
To create a NoLang application, we need to have NodeJS installed.
then in a directory for application there is the config file. 
Config file must be in JSON or JSON5 format and can have any name, its default name is <b>app.json</b> or <b>app.json5</b>

```json
{
	"name": "sample app",
	"schemas": [
		{
			"$id": "entity-schema-id",
			"properties": {
				"FieldName1": {
					"type": "string"
				},
				"FieldName2": {
					"type": "number"
				}
			}
		}
	],
	"endpoints": [
		{
			"type": "http",
			"port": 80,
			"routes": [
				{
					"path": "/",
					"type": "html",
					"method": "post"
				}
			]
		}
	]
}
```
## Install Nolang
To install Nolang there are two ways:
1. Downloading the executable Nolang for Windows or Linux.
   - <a href="https://github.com/nolangjs/nolangjs/releases/tag/nolang_runtime_1.2.1">Nolang executable files</a>
    
2. Installing Nolang by npm.
    ```
    npm i nolangjs -g
    ```

## Run Nolang app
After installing Nolang using installer or npm, Nolang cli can be used to run a Nolang application.


Using executable:
```
# cd /path/to/executable
# nolang_b_lin64.1.2.1 app.json5 
```
If Nolang was installed using Windows installer or npm:
```
nolang app.json5
```

You can also use following commands:

```
nolang app.json -d path/to/app/dir
nolang -a app.json5 -d path/to/app/dir
nolang -h
nolang -v
```

# Documentation
Refer to Nolang website by address https://www.nolang.org.


# Share Your Feedback
We value your input! If you have suggestions, issues, or comments about our package, please don't hesitate to reach out. Your feedback helps us improve. You can connect us with info[@]nolang.org.
