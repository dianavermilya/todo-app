/*global todomvc, angular */
'use strict';

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
todomvc.controller('TodoCtrl', function TodoCtrl($scope, $location, todoStorage, filterFilter) {
	var promise = todoStorage.init();
    var todos = $scope.todos = [];

    $scope.assignees = [];
	promise.then(function (activeUser) {

        var me = {_id: "123213", name: "Me"};
        var p = todoStorage.kinveyAddAssignee(me).then (function (res) {
            todoStorage.kinveyGetAssignees().then(function (response){
                $scope.assignees = response;
                console.log("kinvey assignees are:", response);
                console.log("scope.assignees are", $scope.assignees)
                $scope.$apply();
                return;
            });
            return;
        });

		var get = todoStorage.kinveyGet();
		get.then(function (oldtodos) {
        for (var i=0;i<oldtodos.length;i++){
            $scope.todos.push(oldtodos[i]);
        }
        $scope.$apply();
		console.log("initial todos", $scope.todos);


        $scope.newTodo = '';
        $scope.editedTodo = null;
     
        $scope.$watch('assignees', true);
        $scope.$watch('todos', function (newValue, oldValue) {
                $scope.remainingCount = filterFilter(todos, { completed: false }).length;
                $scope.completedCount = todos.length - $scope.remainingCount;
                $scope.allChecked = !$scope.remainingCount;
                if (newValue !== oldValue) { // This prevents unneeded calls to the local storage
                        console.log("watch was called. $scope.todos: ", todos);
                }
        }, true);

        if ($location.path() === '') {
                $location.path('/');
        }

        $scope.location = $location;

        $scope.$watch('location.path()', function (path) {
                $scope.statusFilter = (path === '/active') ?
                        { completed: false } : (path === '/completed') ?
                        { completed: true } : null;
        });

        $scope.addTodo = function () {
                var newTodoName = $scope.newTodo.trim();
                if (!newTodoName.length) {
                        return;
                }
                var todo = 
                	{
                		_id: todoStorage.uuid(),
                        title: newTodoName,
                        completed: false,
                        assignee: "Me"
                	};
                console.log("about to add a todo to scope.todos", todos);
                todos.push(todo);
                console.log("added a todo to scope.todos", todos);
                console.log("todo to push", todo);
				promise = todoStorage.kinveySave(promise, todo).then (function (res) {
					todoStorage.kinveyGet().then(function (response){
						console.log("kinvey todos are at:", response);
					});
				});

                $scope.newTodo = '';
        };

        $scope.updateCompleted = function (todo) {
	        todoStorage.kinveyUpdate(todo);
        };

        $scope.editTodo = function (todo) {
                $scope.editedTodo = todo;
                // Clone the original todo to restore it on demand.
                $scope.originalTodo = angular.extend({}, todo);
        };


        $scope.doneEditing = function (todo) {
                $scope.editedTodo = null;
                todo.title = todo.title.trim();

                if (!todo.title) {
                        $scope.removeTodo(todo);
                } else {
                	todoStorage.kinveyUpdate(todo);
                }
        };

        $scope.revertEditing = function (todo) {
                todos[todos.indexOf(todo)] = $scope.originalTodo;
                $scope.doneEditing($scope.originalTodo);
        };

        $scope.assign = function (todo) {
            console.log("assign called");
            $scope.editedAssignTodo = todo;
            $scope.originalTodo = angular.extend({}, todo);
            console.log($scope.assignees);
        }

        $scope.doneAssigning = function (todo) {
            console.log("doneAssigning called");
            $scope.editedAssignTodo = null;
            todo.assignee = todo.assignee.trim();
            todoStorage.kinveyUpdate(todo);
            var update = true
            for (var i=0;i<$scope.assignees.length;i++) {
                if ($scope.assignees[i].name == todo.assignee) update = false
            }
            if (update){
                var newAssignee = {_id: todoStorage.uuid(), name: todo.assignee}
                $scope.assignees.push(newAssignee);
                todoStorage.kinveyAddAssignee(newAssignee);
            }
            console.log("from doneAssigning, scope.assignees are:", $scope.assignees);

        };

        $scope.removeTodo = function (todo) {
            todoStorage.kinveyRemove(todo);
            todos.splice(todos.indexOf(todo), 1);
        };

        $scope.clearCompletedTodos = function () {
                $scope.todos = todos = todos.filter(function (val) {
                    return !val.completed;
                });
                todoStorage.kinveyClearCompleted();
        };

        $scope.clearAssignees = function () {
                console.log("clear assignees");
                $scope.assignees = [];
                todoStorage.kinveyClearAssignees();
        };

        $scope.markAll = function (completed) {
                todos.forEach(function (todo) {
                        todo.completed = completed;
                        $scope.updateCompleted(todo);
                });
        };
	}); 		});
});