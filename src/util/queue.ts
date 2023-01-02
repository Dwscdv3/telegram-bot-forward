const pendingTasks: Task[] = [];
let _doNotRetry = (reason: any) => false;
let _catch = (err: unknown): void => {
    throw err;
};

function enqueue<T>(operation: () => Promise<T>, retry = 10) {
    const promise = new Promise<T>((resolve, reject) => {
        pendingTasks.push({ retry, operation, resolve, reject });
    });
    promise.catch(_catch);
    return promise;
}

function run(task: Task) {
    task.operation()
        .then(value => task.resolve(value))
        .catch(reason => {
            if (task.retry > 0 && !_doNotRetry(reason)) {
                setTimeout(() => {
                    pendingTasks.push(task);
                }, Math.max(1, 10 - task.retry) * 2000);
            } else {
                task.reject(reason);
            }
        });
}

const _timer = setInterval(() => {
    const task = pendingTasks.shift();
    if (task) {
        task.retry--;
        run(task);
    }
}, 40);

function doNotRetry(predicate: (reason: any) => boolean) {
    _doNotRetry = predicate;
}
function $catch(callback: (err: unknown) => void) {
    _catch = callback;
}

type Task = {
    retry: number;
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

export { enqueue };
export default { enqueue, doNotRetry, catch: $catch, _timer };
