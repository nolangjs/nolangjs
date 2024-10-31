<p align="center">
  <img src="https://nolang.org/img/nolangtlogo.png" width="350" title="Nolang" alt="Nolang">
</p>

# What is Nolang

Nolang is a programming language or a framework with JSON syntax.
In Nolang All things are JSON and code is similar data.
A programmer only needs to <b>Define the entities</b>, when programs with Nolang.
Nolang is not an object-oriented language, but it is an Entity-oriented language.

## Usage of Nolang
Nolang is very suitable for creating Back-End, RESTful services, Micro-services and even for Front-End. A fullstack application can be implemented with Nolang. 

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
To connect and send a Script to NoLang program, we must use NoLang Endpoints which is described next.



# Nolang Application
Creating application with Nolang is very easy.

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

## Run Nolang app
After installing nolangjs package, Nolang cli can be used to run a Nolang application.

```
npm i nolangjs -g
```
```
nolang /path/to/dir app.json
```

# Documentation
Refer to Nolang website by address https://www.nolang.org.


# Share Your Feedback
We value your input! If you have suggestions, issues, or comments about our package, please don't hesitate to reach out. Your feedback helps us improve. You can connect us with info[@]nolang.org.
