//public/main.js

var angularTodo = angular.module('angularTodo', ['ui.sortable']);

function mainController($scope, $http) {
	$scope.formData = {};
	$scope.todos = {};

	// Cuando se cargue la página, pide del API todos los TODOs
	$http.get('/api/todos')
		.success(function(data) {
			$scope.todos = data;
			console.log(data)
		})
		.error(function(data) {
			console.log('Error: ' + data);
		});

	// Cuando se añade un nuevo TODO, manda el texto a la API
	$scope.createTodo = function(){
		$http.post('/api/todos', $scope.formData)
			.success(function(data) {
				$scope.formData = {};
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error:' + data);
			});
	};
	
	// Edita un TODO
	$scope.completeTodo = function(id,completed) {
		$http.put('/api/todos/' + id, {'completed':completed})
			.success(function(data) {
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error:' + data);
			});
	};

	// Borra un TODO despues de checkearlo como acabado
	$scope.deleteTodo = function(id) {
		$http.delete('/api/todos/' + id)
			.success(function(data) {
				$scope.todos = data;
				console.log(data);
			})
			.error(function(data) {
				console.log('Error:' + data);
			});
	};

	$scope.reorderTodo = function(id, index, newIndex) {
		$scope.todos[index].order = newIndex;
		$http.put('/api/todos/' + id, {'order': newIndex})
            .success(function(data) {
                console.log(data);
            })
            .error(function(data) {
                console.log('Error:' + data);
            });
	};

	$scope.sortableOptions = {
		update: function(e, ui) {
			index = ui.item.sortable.index;
			dropindex = ui.item.sortable.dropindex;
			todo = $scope.todos[index]; 
			$scope.reorderTodo(todo._id, index, dropindex);
			if( index < dropindex ) {
				for (i=index+1; i<=dropindex; i++) {
					todo = $scope.todos[i];
					$scope.reorderTodo(todo._id, i, i-1);
				}
			} else {
				for (i=index-1; i>=dropindex; i--) {
					todo = $scope.todos[i];
					$scope.reorderTodo(todo._id, i, i+1);
				}
			}
		},
		stop: function(e, ui) {
		  // this callback has the changed model
		}
	};	

	$scope.$watch('query', function(){
			$scope.sortableOptions.disabled = ($scope.query != '');
		}
	);
}

