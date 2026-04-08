// @ts-nocheck
// ConquestV14 - Conquest + Cinematic Intro
// Auto-generated bundle - DO NOT EDIT
// Generated: 2026-04-08T12:46:02.047Z


// Module: lib/logging.ts
class Logging {
    constructor(tag: string) {
        this._tag = tag;
    }
    private _tag: string;
    private _logLevel: Logging.LogLevel = Logging.LogLevel.Info;
    private _includeError: boolean = false;
    private _logger?: (text: string) => Promise<void> | void;
    private _safeErrorToString(error: unknown): string {
        try {
            if (error instanceof Error) {
                try {
                    return error.message || 'Error';
                } catch {
                    return 'Error (message unavailable)';
                }
            }
            try {
                return String(error);
            } catch {
                return '[Error object]';
            }
        } catch {
            return '[Unable to stringify error]';
        }
    }
    public willLog(logLevel: Logging.LogLevel): boolean {
        return this._logger !== undefined && logLevel >= this._logLevel;
    }
    public log(text: string, logLevel: Logging.LogLevel = Logging.LogLevel.Warning, error?: unknown): void {
        if (!this._logger || logLevel < this._logLevel) return;
        try {
            const errorText = this._includeError && error ? ` - Error: ${this._safeErrorToString(error)}` : '';
            const result = this._logger(`<${this._tag}> ${text}${errorText}`);
            if (result instanceof Promise) {
                result.catch((error) => {
                    console.log(`<${this._tag}> Error in async logger:`, error);
                });
            }
        } catch (error: unknown) {
            console.log(`<${this._tag}> Error in sync logger:`, error);
        }
    }
    public setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        this._logger = log;
        this._logLevel = logLevel ?? Logging.LogLevel.Warning;
        this._includeError = includeError ?? false;
    }
}
namespace Logging {
    export enum LogLevel {
        Debug = 0,
        Info = 1,
        Warning = 2,
        Error = 3,
    }
}


// Module: lib/callback-handler.ts
namespace CallbackHandler {
    export function invoke<T extends (...args: any[]) => Promise<void> | void>(
        callback: T | undefined,
        args: Parameters<T>,
        errorContext: string,
        logging: Logging,
        logLevel: Logging.LogLevel = Logging.LogLevel.Error
    ): void {
        if (!callback) return;
        try {
            const result = callback(...args);
            if (result instanceof Promise) {
                result.catch((error: unknown) => {
                    logging.log(
                        `Error in async ${errorContext} ${callback.name ?? 'anonymous'} callback:`,
                        logLevel,
                        error
                    );
                });
            }
        } catch (error: unknown) {
            logging.log(`Error in sync ${errorContext} ${callback?.name ?? 'anonymous'} callback:`, logLevel, error);
        }
    }
    export function invokeNoArgs(
        callback: (() => Promise<void> | void) | undefined,
        errorContext: string,
        logging: Logging,
        logLevel: Logging.LogLevel = Logging.LogLevel.Error
    ): void {
        invoke(callback, [] as any, errorContext, logging, logLevel);
    }
}


// Module: lib/events.ts
namespace Events {
    type Handler = (...args: any[]) => void | Promise<void>;
    const _logging = new Logging('Events');
    const _handlers = new Map<string, Set<Handler>>();
    export const LogLevel = Logging.LogLevel;
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        _logging.setLogging(log, logLevel, includeError);
    }
    function _subscribe(eventName: string, handler: Handler): () => void {
        if (!_handlers.has(eventName)) {
            _handlers.set(eventName, new Set());
        }
        _handlers.get(eventName)!.add(handler);
        return () => _unsubscribe(eventName, handler);
    }
    function _unsubscribe(eventName: string, handler: Handler): void {
        _handlers.get(eventName)?.delete(handler);
    }
    function _trigger(eventName: string, ...args: any[]): void {
        const handlers = _handlers.get(eventName);
        if (!handlers) return;
        for (const handler of handlers) {
            CallbackHandler.invoke(handler, args as any, eventName, _logging, Logging.LogLevel.Error);
        }
    }
    function _handlerCount(eventName: string): number {
        return _handlers.get(eventName)?.size ?? 0;
    }
    export interface EventChannel {
        subscribe(handler: Handler): () => void;
        unsubscribe(handler: Handler): void;
        trigger(...args: any[]): void;
        handlerCount(): number;
    }
    function makeChannel(name: string): EventChannel {
        return {
            subscribe: (h: Handler) => _subscribe(name, h),
            unsubscribe: (h: Handler) => _unsubscribe(name, h),
            trigger: (...args: any[]) => _trigger(name, ...args),
            handlerCount: () => _handlerCount(name),
        };
    }
    export const OnPlayerUIButtonEvent = makeChannel('OnPlayerUIButtonEvent');
}


// Module: lib/solid-ui.ts
namespace SolidUI {
    const logging = new Logging('SolidUI');
    export const LogLevel = Logging.LogLevel;
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        logging.setLogging(log, logLevel, includeError);
    }
    class Subscriber {
        public dependencies = new Set<Set<Subscriber>>();
        constructor(public fn: () => void) {
            this.execute();
        }
        execute() {
            cleanup(this);
            context.push(this);
            try {
                this.fn();
            } finally {
                context.pop();
            }
        }
        dispose() {
            cleanup(this);
        }
    }
    export type Accessor<T> = () => T;
    export type Setter<T> = (newValue: T | ((prev: T) => T)) => void;
    type Constructable<Params, Instance> = new (params: Params) => Instance;
    type FunctionalComponent<Params, Instance> = (props: Reactive<Params>) => Instance;
    type Reactive<T> = {
        [K in keyof T]?: T[K] | Accessor<T[K]>;
    };
    function isPlainObject(obj: unknown): boolean {
        return obj !== null && typeof obj === 'object' && obj.constructor === Object;
    }
    function isEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; ++i) {
                if (!isEqual(a[i], b[i])) return false;
            }
            return true;
        }
        if (isPlainObject(a) && isPlainObject(b)) {
            const objA = a as Record<string, unknown>;
            const objB = b as Record<string, unknown>;
            const keysA = Object.keys(objA);
            const keysB = Object.keys(objB);
            if (keysA.length !== keysB.length) return false;
            for (const key of keysA) {
                if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
                if (!isEqual(objA[key], objB[key])) return false;
            }
            return true;
        }
        return false;
    }
    function isAccessor<T>(value: T): value is T & Accessor<T> {
        return typeof value === 'function';
    }
    function isClassConstructor(fn: unknown): boolean {
        if (typeof fn !== 'function') return false;
        if (fn.toString().substring(0, 5) === 'class') return true;
        if (fn.prototype && Object.getOwnPropertyNames(fn.prototype).length > 1) return true;
        return false;
    }
    const pendingEffects = new Set<Subscriber>();
    let isFlushPending = false;
    const MAX_FLUSH_CYCLES = 1_000;
    function flush(): void {
        isFlushPending = false;
        let cycles = 0;
        for (const sub of pendingEffects) {
            if (cycles++ > MAX_FLUSH_CYCLES) {
                pendingEffects.clear();
                logging.log(
                    'SolidUI: Maximum reactive stack depth exceeded. You might have an infinite loop in an effect.',
                    LogLevel.Error
                );
            }
            pendingEffects.delete(sub);
            try {
                sub.execute();
            } catch (error: unknown) {
                logging.log('Error in effect:', LogLevel.Error, error);
            }
        }
    }
    function schedule(subscribers: Set<Subscriber>): void {
        for (const sub of subscribers) {
            pendingEffects.add(sub);
        }
        if (isFlushPending) return;
        isFlushPending = true;
        Promise.resolve()
            .then(flush)
            .catch((error: unknown) => {
                logging.log('Error in flush:', LogLevel.Error, error);
            });
    }
    const context: (Subscriber | null)[] = [];
    let currentCleanupList: Set<() => void> | null = null;
    function cleanup(subscriber: Subscriber): void {
        for (const dependency of subscriber.dependencies) {
            dependency.delete(subscriber);
        }
        subscriber.dependencies.clear();
    }
    export function untrack<T>(fn: () => T): T {
        context.push(null);
        try {
            return fn();
        } finally {
            context.pop();
        }
    }
    export function createSignal<T>(initialValue: T): [Accessor<T>, Setter<T>] {
        const subscriptions = new Set<Subscriber>();
        let value = initialValue;
        const read: Accessor<T> = (): T => {
            const observer = context[context.length - 1];
            if (observer) {
                observer.dependencies.add(subscriptions.add(observer));
            }
            return value;
        };
        const write: Setter<T> = (newValue: T | ((prev: T) => T)): void => {
            const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
            if (isEqual(value, nextValue)) return;
            value = nextValue;
            schedule(subscriptions);
        };
        return [read, write];
    }
    export function createEffect(fn: () => void): () => void {
        const effect = new Subscriber(fn);
        return () => effect.dispose();
    }
    export function createMemo<T>(fn: () => T): Accessor<T> {
        const [s, set] = createSignal<T>(fn());
        createEffect(() => set(fn()));
        return s;
    }
    export function createRoot<T>(fn: (dispose: () => void) => T): T {
        const previousCleanupList = currentCleanupList;
        const cleanupList = new Set<() => void>();
        currentCleanupList = cleanupList;
        const dispose = () => {
            cleanupList.forEach((c) => c());
            cleanupList.clear();
        };
        const result = fn(dispose);
        currentCleanupList = previousCleanupList;
        return result;
    }
    const storeSubscribers = new WeakMap<object, Map<string | symbol, Set<Subscriber>>>();
    function getStoreSubscribers(target: object, key: string | symbol): Set<Subscriber> {
        let objMap = storeSubscribers.get(target);
        if (!objMap) {
            objMap = new Map();
            storeSubscribers.set(target, objMap);
        }
        let keySet = objMap.get(key);
        if (!keySet) {
            keySet = new Set();
            objMap.set(key, keySet);
        }
        return keySet;
    }
    export function createStore<T extends object>(initialState: T): [T, (fn: (state: T) => void) => void] {
        const handler: ProxyHandler<object> = {
            get(target, key, receiver) {
                const value = Reflect.get(target, key, receiver);
                const observer = context[context.length - 1];
                if (observer) {
                    observer.dependencies.add(getStoreSubscribers(target, key).add(observer));
                }
                return typeof value === 'object' && value !== null ? new Proxy(value, handler) : value;
            },
            set(target, key, value, receiver) {
                const oldValue = Reflect.get(target, key, receiver);
                if (isEqual(oldValue, value)) return true;
                const result = Reflect.set(target, key, value, receiver);
                schedule(getStoreSubscribers(target, key));
                return result;
            },
        };
        const store = new Proxy(initialState, handler) as T;
        const setStore = (producer: (state: T) => void) => producer(store);
        return [store, setStore];
    }
    const contextValues = new Map<symbol, unknown[]>();
    export interface Context<T> {
        id: symbol;
        defaultValue: T;
        provide: (value: T, fn: () => void) => void;
    }
    export function createContext<T>(defaultValue: T): Context<T> {
        const id = Symbol('context');
        contextValues.set(id, []);
        return {
            id,
            defaultValue,
            provide(value: T, fn: () => void) {
                const stack = contextValues.get(id)!;
                stack.push(value);
                try {
                    fn();
                } finally {
                    stack.pop();
                }
            },
        };
    }
    export function useContext<T>(context: Context<T>): T {
        const stack = contextValues.get(context.id);
        return stack && stack.length > 0 ? (stack[stack.length - 1] as T) : context.defaultValue;
    }
    export function onCleanup(fn: () => void): void {
        currentCleanupList?.add(fn);
    }
    function setProperty<T>(instance: T, key: keyof T, value: unknown): void {
        try {
            (instance as unknown as Record<keyof T, unknown>)[key] = value;
        } catch {
        }
    }
    export function h<P extends object, T>(
        component: Constructable<P, T> | FunctionalComponent<P, T>,
        props: Reactive<P> = {}
    ): T {
        if (!isClassConstructor(component)) return (component as FunctionalComponent<P, T>)(props);
        const ClassConstructor = component as Constructable<P, T>;
        const previousCleanupList = currentCleanupList;
        const cleanupList = new Set<() => void>();
        currentCleanupList = cleanupList;
        const constructorParams: Record<string, unknown> = {};
        const dynamicBindings: { key: keyof P; signal: Accessor<unknown> }[] = [];
        for (const [key, value] of Object.entries(props)) {
            if (/^on[A-Z]/.test(key)) {
                constructorParams[key] = value;
                continue;
            }
            if (isAccessor(value)) {
                constructorParams[key] = value();
                dynamicBindings.push({ key: key as keyof P, signal: value });
            } else {
                constructorParams[key] = value;
            }
        }
        const instance = new ClassConstructor(constructorParams as P);
        dynamicBindings.forEach(({ key, signal }) => {
            const dispose = createEffect(() => {
                setProperty(instance, key as unknown as keyof T, signal());
            });
            onCleanup(dispose);
        });
        if (cleanupList.size > 0) {
            const instanceWithDelete = instance as { delete?: (...args: unknown[]) => unknown };
            const originalDelete = instanceWithDelete.delete;
            if (typeof originalDelete === 'function') {
                instanceWithDelete.delete = function (...args: unknown[]) {
                    cleanupList.forEach((fn) => fn());
                    cleanupList.clear();
                    return originalDelete.apply(this, args);
                };
            }
        }
        currentCleanupList = previousCleanupList;
        const instanceWithDelete = instance as { delete?: () => void };
        if (typeof instanceWithDelete.delete === 'function') {
            onCleanup(() => instanceWithDelete.delete!());
        }
        return instance;
    }
    export function Index<T>(each: Accessor<T[]>, render: (item: Accessor<T>, index: number) => unknown): void {
        const rows: { setItem: Setter<T>; dispose: () => void }[] = [];
        createEffect(() => {
            const list = each();
            const newLength = list.length;
            const oldLength = rows.length;
            if (newLength > oldLength) {
                for (let i = 0; i < oldLength; ++i) {
                    rows[i].setItem(list[i]);
                }
                for (let i = oldLength; i < newLength; ++i) {
                    createRoot((dispose) => {
                        const [item, setItem] = createSignal(list[i]);
                        const uiElement = render(item, i);
                        const rowDispose = () => {
                            dispose();
                            if (uiElement && typeof (uiElement as any).delete === 'function') {
                                (uiElement as any).delete();
                            }
                        };
                        rows.push({ setItem, dispose: rowDispose });
                    });
                }
                return;
            }
            if (newLength < oldLength) {
                for (let i = oldLength - 1; i >= newLength; --i) {
                    rows.pop()?.dispose();
                }
            }
            for (let i = 0; i < newLength; ++i) {
                rows[i].setItem(list[i]);
            }
        });
    }
}


// Module: lib/ui-v8.ts
namespace UI {
    const logging = new Logging('UI');
    export const LogLevel = Logging.LogLevel;
    export function setLogging(
        log?: (text: string) => Promise<void> | void,
        logLevel?: Logging.LogLevel,
        includeError?: boolean
    ): void {
        logging.setLogging(log, logLevel, includeError);
    }
    type BaseParams = {
        anchor?: mod.UIAnchor;
        parent?: Parent;
        visible?: boolean;
        bgColor?: mod.Vector;
        bgAlpha?: number;
        bgFill?: mod.UIBgFill;
        depth?: mod.UIDepth;
        receiver?: mod.Player | mod.Team;
        uiInputModeWhenVisible?: boolean;
    };
    export type Size = {
        width: number;
        height: number;
    };
    export type Position = {
        x: number;
        y: number;
    };
    type EitherPosition =
        | ({ position?: Position } & { x?: never; y?: never })
        | ({ x?: number; y?: number } & { position?: never });
    type EitherSize =
        | ({ size?: Size } & { width?: never; height?: never })
        | ({ width?: number; height?: number } & { size?: never });
    export type ElementParams = BaseParams & EitherPosition & EitherSize;
    export type FinalElementParams = {
        name: string;
        parent: Parent;
        anchor: mod.UIAnchor;
        visible: boolean;
        bgColor: mod.Vector;
        bgAlpha: number;
        bgFill: mod.UIBgFill;
        depth: mod.UIDepth;
        x: number;
        y: number;
        width: number;
        height: number;
        receiver: GlobalReceiver | TeamReceiver | PlayerReceiver;
        uiInputModeWhenVisible: boolean;
    };
    export interface Parent {
        name: string;
        uiWidget: mod.UIWidget;
        receiver: GlobalReceiver | TeamReceiver | PlayerReceiver;
        children: Element[];
        attachChild(child: Element): void;
        detachChild(child: Element): void;
    }
    export interface Button {
        onClick: ((player: mod.Player) => Promise<void> | void) | undefined;
    }
    abstract class Receiver<T extends mod.Player | mod.Team | undefined> {
        protected _id: string;
        protected _nativeReceiver: T;
        protected _inputModeRequesters: Set<Element> = new Set();
        protected constructor(id: string, receiver: T) {
            this._id = id;
            this._nativeReceiver = receiver;
        }
        public get id(): string { return this._id; }
        public get nativeReceiver(): T { return this._nativeReceiver; }
        public get isInputModeRequested(): boolean { return this._inputModeRequesters.size > 0; }
        public addInputModeRequester(element: Element): void {
            const wasAlreadyRequested = this.isInputModeRequested;
            this._inputModeRequesters.add(element);
            if (wasAlreadyRequested) return;
            if (this._nativeReceiver) {
                mod.EnableUIInputMode(true, this._nativeReceiver);
            } else {
                mod.EnableUIInputMode(true);
            }
        }
        public removeInputModeRequester(element: Element): void {
            const wasAlreadyRequested = this.isInputModeRequested;
            this._inputModeRequesters.delete(element);
            if (!wasAlreadyRequested) return;
            if (this.isInputModeRequested) return;
            if (this._nativeReceiver) {
                mod.EnableUIInputMode(false, this._nativeReceiver);
            } else {
                mod.EnableUIInputMode(false);
            }
        }
    }
    export class GlobalReceiver extends Receiver<undefined> {
        public static readonly instance = new GlobalReceiver();
        private constructor() { super('g', undefined); }
    }
    export class TeamReceiver extends Receiver<mod.Team> {
        private static _instances = new Map<number, TeamReceiver>();
        private constructor(receiver: mod.Team) {
            const id = mod.GetObjId(receiver);
            super(`t${id}`, receiver);
            TeamReceiver._instances.set(id, this);
        }
        public static getInstance(receiver: mod.Team): TeamReceiver {
            return TeamReceiver._instances.get(mod.GetObjId(receiver)) ?? new TeamReceiver(receiver);
        }
    }
    export class PlayerReceiver extends Receiver<mod.Player> {
        private static _instances = new Map<number, PlayerReceiver>();
        private constructor(receiver: mod.Player) {
            const id = mod.GetObjId(receiver);
            super(`p${id}`, receiver);
            PlayerReceiver._instances.set(id, this);
        }
        public static getInstance(receiver: mod.Player): PlayerReceiver {
            return PlayerReceiver._instances.get(mod.GetObjId(receiver)) ?? new PlayerReceiver(receiver);
        }
    }
    export abstract class Node {
        protected readonly _logging: Logging = logging;
        protected _name: string;
        protected _uiWidget: mod.UIWidget;
        protected _receiver: GlobalReceiver | TeamReceiver | PlayerReceiver;
        public constructor(
            name: string,
            uiWidget: mod.UIWidget,
            receiver: GlobalReceiver | TeamReceiver | PlayerReceiver
        ) {
            this._name = name;
            this._uiWidget = uiWidget;
            this._receiver = receiver;
        }
        public get name(): string { return this._name; }
        public get uiWidget(): mod.UIWidget { return this._uiWidget; }
        public get receiver(): GlobalReceiver | TeamReceiver | PlayerReceiver { return this._receiver; }
    }
    export class Root extends Node implements Parent {
        public static readonly instance = new Root();
        private _children: Set<Element> = new Set();
        private constructor() { super('root', mod.GetUIRoot(), GlobalReceiver.instance); }
        public get children(): Element[] { return Array.from(this._children); }
        public attachChild(child: Element): void { this._children.add(child); }
        public detachChild(child: Element): void { this._children.delete(child); }
    }
    export abstract class Element extends Node {
        protected _parent: Parent;
        protected _visible: boolean;
        protected _x: number;
        protected _y: number;
        protected _width: number;
        protected _height: number;
        protected _bgColor: mod.Vector;
        protected _bgAlpha: number;
        protected _bgFill: mod.UIBgFill;
        protected _depth: mod.UIDepth;
        protected _anchor: mod.UIAnchor;
        protected _uiInputModeWhenVisible: boolean;
        protected _deleted: boolean = false;
        public constructor(params: FinalElementParams) {
            super(params.name, mod.FindUIWidgetWithName(params.name) as mod.UIWidget, params.receiver);
            this._parent = params.parent;
            this._visible = params.visible;
            this._x = params.x;
            this._y = params.y;
            this._width = params.width;
            this._height = params.height;
            this._bgColor = params.bgColor;
            this._bgAlpha = params.bgAlpha;
            this._bgFill = params.bgFill;
            this._depth = params.depth;
            this._anchor = params.anchor;
            this._uiInputModeWhenVisible = params.uiInputModeWhenVisible;
            this._parent.attachChild(this);
            if (this._uiInputModeWhenVisible && this._visible) {
                this._receiver.addInputModeRequester(this);
            }
        }
        protected _isDeletedCheck(): boolean {
            if (this._deleted) {
                logging.log(`Element ${this.name} already deleted.`, LogLevel.Warning);
                return true;
            }
            return false;
        }
        public get parent(): Parent { return this._parent; }
        public set parent(parent: Parent) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetParent(this._uiWidget, parent.uiWidget);
            this._parent.detachChild(this);
            this._parent = parent;
            this._parent.attachChild(this);
        }
        public get visible(): boolean { return this._visible; }
        public set visible(visible: boolean) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetVisible(this._uiWidget, (this._visible = visible));
            if (!this._uiInputModeWhenVisible) return;
            if (visible) {
                this._receiver.addInputModeRequester(this);
            } else {
                this._receiver.removeInputModeRequester(this);
            }
        }
        public setVisible(visible: boolean): this { this.visible = visible; return this; }
        public show(): this { this.visible = true; return this; }
        public hide(): this { this.visible = false; return this; }
        public toggle(): this { this.visible = !this.visible; return this; }
        public get deleted(): boolean { return this._deleted; }
        public delete(): void {
            if (this._isDeletedCheck()) return;
            this._deleted = true;
            if (this._uiInputModeWhenVisible) {
                this._receiver.removeInputModeRequester(this);
            }
            this._parent.detachChild(this);
            mod.DeleteUIWidget(this._uiWidget);
        }
        public get x(): number { return this._x; }
        public set x(x: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetPosition(this._uiWidget, mod.CreateVector((this._x = x), this._y, 0));
        }
        public setX(x: number): this { this.x = x; return this; }
        public get y(): number { return this._y; }
        public set y(y: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetPosition(this._uiWidget, mod.CreateVector(this._x, (this._y = y), 0));
        }
        public setY(y: number): this { this.y = y; return this; }
        public get position(): Position { return { x: this._x, y: this._y }; }
        public set position(params: Position) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetPosition(this._uiWidget, mod.CreateVector((this._x = params.x), (this._y = params.y), 0));
        }
        public setPosition(params: Position): this { this.position = params; return this; }
        public get width(): number { return this._width; }
        public set width(w: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector((this._width = w), this._height, 0));
        }
        public setWidth(w: number): this { this.width = w; return this; }
        public get height(): number { return this._height; }
        public set height(h: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector(this._width, (this._height = h), 0));
        }
        public setHeight(h: number): this { this.height = h; return this; }
        public get size(): Size { return { width: this._width, height: this._height }; }
        public set size(params: Size) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector((this._width = params.width), (this._height = params.height), 0));
        }
        public setSize(params: Size): this { this.size = params; return this; }
        public get bgColor(): mod.Vector { return this._bgColor; }
        public set bgColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetBgColor(this._uiWidget, (this._bgColor = color));
        }
        public setBgColor(color: mod.Vector): this { this.bgColor = color; return this; }
        public get bgAlpha(): number { return this._bgAlpha; }
        public set bgAlpha(alpha: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetBgAlpha(this._uiWidget, (this._bgAlpha = alpha));
        }
        public setBgAlpha(alpha: number): this { this.bgAlpha = alpha; return this; }
        public get bgFill(): mod.UIBgFill { return this._bgFill; }
        public set bgFill(fill: mod.UIBgFill) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetBgFill(this._uiWidget, (this._bgFill = fill));
        }
        public setBgFill(fill: mod.UIBgFill): this { this.bgFill = fill; return this; }
        public get depth(): mod.UIDepth { return this._depth; }
        public set depth(depth: mod.UIDepth) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetDepth(this._uiWidget, (this._depth = depth));
        }
        public setDepth(depth: mod.UIDepth): this { this.depth = depth; return this; }
        public get anchor(): mod.UIAnchor { return this._anchor; }
        public set anchor(anchor: mod.UIAnchor) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetAnchor(this._uiWidget, (this._anchor = anchor));
        }
        public setAnchor(anchor: mod.UIAnchor): this { this.anchor = anchor; return this; }
        public get uiInputModeWhenVisible(): boolean { return this._uiInputModeWhenVisible; }
        public set uiInputModeWhenVisible(newValue: boolean) {
            if (this._isDeletedCheck()) return;
            const previousValue = this._uiInputModeWhenVisible;
            if (previousValue === newValue) return;
            this._uiInputModeWhenVisible = newValue;
            if (newValue && this.visible) {
                this._receiver.addInputModeRequester(this);
            } else {
                this._receiver.removeInputModeRequester(this);
            }
        }
    }
    export const COLORS = {
        BLACK: mod.CreateVector(0, 0, 0),
        GREY_25: mod.CreateVector(0.25, 0.25, 0.25),
        GREY_50: mod.CreateVector(0.5, 0.5, 0.5),
        GREY_75: mod.CreateVector(0.75, 0.75, 0.75),
        WHITE: mod.CreateVector(1, 1, 1),
        RED: mod.CreateVector(1, 0, 0),
        GREEN: mod.CreateVector(0, 1, 0),
        BLUE: mod.CreateVector(0, 0, 1),
        YELLOW: mod.CreateVector(1, 1, 0),
        PURPLE: mod.CreateVector(1, 0, 1),
        CYAN: mod.CreateVector(0, 1, 1),
        MAGENTA: mod.CreateVector(1, 0, 1),
        BF_GREY_1: mod.CreateVector(0.8353, 0.9216, 0.9765),
        BF_GREY_2: mod.CreateVector(0.3294, 0.3686, 0.3882),
        BF_GREY_3: mod.CreateVector(0.2118, 0.2235, 0.2353),
        BF_GREY_4: mod.CreateVector(0.0314, 0.0431, 0.0431),
        BF_BLUE_BRIGHT: mod.CreateVector(0.4392, 0.9216, 1.0),
        BF_BLUE_DARK: mod.CreateVector(0.0745, 0.1843, 0.2471),
        BF_RED_BRIGHT: mod.CreateVector(1.0, 0.5137, 0.3804),
        BF_RED_DARK: mod.CreateVector(0.251, 0.0941, 0.0667),
        BF_GREEN_BRIGHT: mod.CreateVector(0.6784, 0.9922, 0.5255),
        BF_GREEN_DARK: mod.CreateVector(0.2784, 0.4471, 0.2118),
        BF_YELLOW_BRIGHT: mod.CreateVector(1.0, 0.9882, 0.6118),
        BF_YELLOW_DARK: mod.CreateVector(0.4431, 0.3765, 0.0),
    };
    export const ROOT_NODE = Root.instance;
    const BUTTONS = new Map<string, Button>();
    Events.OnPlayerUIButtonEvent.subscribe(handleButtonEvent);
    function handleButtonEvent(player: mod.Player, widget: mod.UIWidget, event: mod.UIButtonEvent): void {
        const name = mod.GetUIWidgetName(widget);
        const onClick = BUTTONS.get(name)?.onClick;
        if (!onClick) return;
        CallbackHandler.invoke(onClick, [player], `click handler for widget ${name}`, logging, LogLevel.Error);
    }
    export function registerButton(name: string, button: Button): () => void {
        if (BUTTONS.has(name)) {
            logging.log(`Button ${name} already registered.`, LogLevel.Warning);
            return () => {};
        }
        BUTTONS.set(name, button);
        return () => { BUTTONS.delete(name); };
    }
    let counter: number = 0;
    function isTeam(receiver?: mod.Player | mod.Team): receiver is mod.Team {
        return receiver !== undefined && mod.IsType(receiver, mod.Types.Team);
    }
    function isPlayer(receiver?: mod.Player | mod.Team): receiver is mod.Player {
        return receiver !== undefined && mod.IsType(receiver, mod.Types.Player);
    }
    export function makeName(parent: Parent, receiver: GlobalReceiver | TeamReceiver | PlayerReceiver): string {
        return `${parent.name}${parent.receiver !== receiver ? `_${receiver.id}` : ''}_${counter++}`;
    }
    export function delegateProperties<T extends object, S extends object>(
        target: T,
        source: S,
        properties: readonly string[]
    ): void {
        for (const prop of properties) {
            Object.defineProperty(target, prop, {
                get() { return (source as Record<string, unknown>)[prop]; },
                set(value: unknown) { (source as Record<string, unknown>)[prop] = value; },
                enumerable: true,
                configurable: true,
            });
            const setterMethodName = `set${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
            (target as Record<string, unknown>)[setterMethodName] = function (value: unknown) {
                (source as Record<string, unknown>)[prop] = value;
                return this;
            };
        }
    }
    export function getPosition(params: ElementParams): Position {
        return { x: params.x ?? params.position?.x ?? 0, y: params.y ?? params.position?.y ?? 0 };
    }
    export function getSize(params: ElementParams): Size {
        return { width: params.width ?? params.size?.width ?? 0, height: params.height ?? params.size?.height ?? 0 };
    }
    export function getReceiver(
        parent: Parent,
        receiverParam?: mod.Player | mod.Team
    ): GlobalReceiver | TeamReceiver | PlayerReceiver {
        if (!receiverParam) return parent.receiver;
        if (isTeam(receiverParam)) return TeamReceiver.getInstance(receiverParam);
        if (isPlayer(receiverParam)) return PlayerReceiver.getInstance(receiverParam);
        return GlobalReceiver.instance;
    }
    export class UIContainer extends Element implements Parent {
        protected _children: Set<Element> = new Set();
        public constructor(params: UIContainer.Params) {
            const parent = params.parent ?? ROOT_NODE;
            const receiver = getReceiver(parent, params.receiver);
            const name = makeName(parent, receiver);
            const { x, y } = getPosition(params);
            const { width, height } = getSize(params);
            const elementParams: FinalElementParams = {
                name, parent,
                visible: params.visible ?? true,
                x, y, width, height,
                anchor: params.anchor ?? mod.UIAnchor.Center,
                bgColor: params.bgColor ?? COLORS.WHITE,
                bgAlpha: params.bgAlpha ?? 0,
                bgFill: params.bgFill ?? mod.UIBgFill.None,
                depth: params.depth ?? mod.UIDepth.AboveGameUI,
                receiver,
                uiInputModeWhenVisible: params.uiInputModeWhenVisible ?? false,
            };
            const args: [string, mod.Vector, mod.Vector, mod.UIAnchor, mod.UIWidget, boolean, number, mod.Vector, number, mod.UIBgFill, mod.UIDepth] = [
                name,
                mod.CreateVector(x, y, 0),
                mod.CreateVector(width, height, 0),
                elementParams.anchor,
                parent.uiWidget,
                elementParams.visible,
                0,
                elementParams.bgColor,
                elementParams.bgAlpha,
                elementParams.bgFill,
                elementParams.depth,
            ];
            if (receiver instanceof GlobalReceiver) {
                mod.AddUIContainer(...args);
            } else {
                mod.AddUIContainer(...args, receiver.nativeReceiver);
            }
            super(elementParams);
            for (const childParams of params.childrenParams ?? []) {
                childParams.parent = this;
                new childParams.type(childParams);
            }
        }
        public get children(): Element[] { return Array.from(this._children); }
        public override delete(): void {
            for (const child of this._children) { child.delete(); }
            super.delete();
        }
        public attachChild(child: Element): void {
            if (this._deleted) return;
            this._children.add(child);
        }
        public detachChild(child: Element): void {
            this._children.delete(child);
        }
    }
    export namespace UIContainer {
        export type ChildParams<T extends ElementParams> = T & {
            type: new (params: T) => Element;
        };
        export type Params = ElementParams & {
            childrenParams?: ChildParams<any>[];
        };
    }
    export class UIText extends Element {
        protected _message: mod.Message;
        protected _textSize: number;
        protected _textColor: mod.Vector;
        protected _textAlpha: number;
        protected _textAnchor: mod.UIAnchor;
        protected _padding: number;
        public constructor(params: UIText.Params) {
            const parent = params.parent ?? ROOT_NODE;
            const receiver = getReceiver(parent, params.receiver);
            const name = makeName(parent, receiver);
            const { x, y } = getPosition(params);
            const { width, height } = getSize(params);
            const padding = params.padding ?? 0;
            const elementParams: FinalElementParams = {
                name, parent,
                visible: params.visible ?? true,
                x, y, width, height,
                anchor: params.anchor ?? mod.UIAnchor.Center,
                bgColor: params.bgColor ?? COLORS.WHITE,
                bgAlpha: params.bgAlpha ?? 0,
                bgFill: params.bgFill ?? mod.UIBgFill.None,
                depth: params.depth ?? mod.UIDepth.AboveGameUI,
                receiver,
                uiInputModeWhenVisible: params.uiInputModeWhenVisible ?? false,
            };
            const message = params.message;
            const textSize = params.textSize ?? 36;
            const textColor = params.textColor ?? COLORS.BLACK;
            const textAlpha = params.textAlpha ?? 1;
            const textAnchor = params.textAnchor ?? mod.UIAnchor.Center;
            const args: [string, mod.Vector, mod.Vector, mod.UIAnchor, mod.UIWidget, boolean, number, mod.Vector, number, mod.UIBgFill, mod.Message, number, mod.Vector, number, mod.UIAnchor, mod.UIDepth] = [
                name,
                mod.CreateVector(x, y, 0),
                mod.CreateVector(width, height, 0),
                elementParams.anchor,
                parent.uiWidget,
                elementParams.visible,
                padding,
                elementParams.bgColor,
                elementParams.bgAlpha,
                elementParams.bgFill,
                message,
                textSize,
                textColor,
                textAlpha,
                textAnchor,
                elementParams.depth,
            ];
            if (receiver instanceof GlobalReceiver) {
                mod.AddUIText(...args);
            } else {
                mod.AddUIText(...args, receiver.nativeReceiver);
            }
            super(elementParams);
            this._message = message;
            this._textSize = textSize;
            this._textColor = textColor;
            this._textAlpha = textAlpha;
            this._textAnchor = textAnchor;
            this._padding = padding;
        }
        public get message(): mod.Message { return this._message; }
        public set message(message: mod.Message) {
            if (this._isDeletedCheck()) return;
            mod.SetUITextLabel(this._uiWidget, (this._message = message));
        }
        public setMessage(message: mod.Message): this { this.message = message; return this; }
        public get textAlpha(): number { return this._textAlpha; }
        public set textAlpha(alpha: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUITextAlpha(this._uiWidget, (this._textAlpha = alpha));
        }
        public setTextAlpha(alpha: number): this { this.textAlpha = alpha; return this; }
        public get textAnchor(): mod.UIAnchor { return this._textAnchor; }
        public set textAnchor(anchor: mod.UIAnchor) {
            if (this._isDeletedCheck()) return;
            mod.SetUITextAnchor(this._uiWidget, (this._textAnchor = anchor));
        }
        public setTextAnchor(anchor: mod.UIAnchor): this { this.textAnchor = anchor; return this; }
        public get textColor(): mod.Vector { return this._textColor; }
        public set textColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUITextColor(this._uiWidget, (this._textColor = color));
        }
        public setTextColor(color: mod.Vector): this { this.textColor = color; return this; }
        public get textSize(): number { return this._textSize; }
        public set textSize(size: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUITextSize(this._uiWidget, (this._textSize = size));
        }
        public setTextSize(size: number): this { this.textSize = size; return this; }
        public get padding(): number { return this._padding; }
        public set padding(padding: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetPadding(this._uiWidget, (this._padding = padding));
        }
        public setPadding(padding: number): this { this.padding = padding; return this; }
    }
    export namespace UIText {
        export type Params = ElementParams & {
            message: mod.Message;
            textSize?: number;
            textColor?: mod.Vector;
            textAlpha?: number;
            textAnchor?: mod.UIAnchor;
            padding?: number;
        };
    }
    export class UIButton extends Element implements Button {
        protected _enabled: boolean;
        protected _baseColor: mod.Vector;
        protected _baseAlpha: number;
        protected _disabledColor: mod.Vector;
        protected _disabledAlpha: number;
        protected _pressedColor: mod.Vector;
        protected _pressedAlpha: number;
        protected _hoverColor: mod.Vector;
        protected _hoverAlpha: number;
        protected _focusedColor: mod.Vector;
        protected _focusedAlpha: number;
        protected _onClick: ((player: mod.Player) => Promise<void> | void) | undefined;
        protected _unregisterAsButton: () => void;
        public constructor(params: UIButton.Params) {
            const parent = params.parent ?? ROOT_NODE;
            const receiver = getReceiver(parent, params.receiver);
            const name = makeName(parent, receiver);
            const { x, y } = getPosition(params);
            const { width, height } = getSize(params);
            const elementParams: FinalElementParams = {
                name, parent,
                visible: params.visible ?? true,
                x, y, width, height,
                anchor: params.anchor ?? mod.UIAnchor.Center,
                bgColor: params.bgColor ?? COLORS.WHITE,
                bgAlpha: params.bgAlpha ?? 1,
                bgFill: params.bgFill ?? mod.UIBgFill.Solid,
                depth: params.depth ?? mod.UIDepth.AboveGameUI,
                receiver,
                uiInputModeWhenVisible: params.uiInputModeWhenVisible ?? false,
            };
            const args: [string, mod.Vector, mod.Vector, mod.UIAnchor, mod.UIWidget, boolean, number, mod.Vector, number, mod.UIBgFill, boolean, mod.Vector, number, mod.Vector, number, mod.Vector, number, mod.Vector, number, mod.Vector, number, mod.UIDepth] = [
                name,
                mod.CreateVector(x, y, 0),
                mod.CreateVector(width, height, 0),
                elementParams.anchor,
                parent.uiWidget,
                elementParams.visible,
                0,
                elementParams.bgColor,
                elementParams.bgAlpha,
                elementParams.bgFill,
                params.enabled ?? true,
                params.baseColor ?? COLORS.BF_GREY_2,
                params.baseAlpha ?? 1,
                params.disabledColor ?? COLORS.BF_GREY_3,
                params.disabledAlpha ?? 1,
                params.pressedColor ?? COLORS.BF_GREEN_BRIGHT,
                params.pressedAlpha ?? 1,
                params.hoverColor ?? COLORS.BF_GREY_1,
                params.hoverAlpha ?? 1,
                params.focusedColor ?? COLORS.BF_GREY_1,
                params.focusedAlpha ?? 1,
                elementParams.depth,
            ];
            if (receiver instanceof GlobalReceiver) {
                mod.AddUIButton(...args);
            } else {
                mod.AddUIButton(...args, receiver.nativeReceiver);
            }
            super(elementParams);
            this._enabled = params.enabled ?? true;
            this._baseColor = params.baseColor ?? COLORS.BF_GREY_2;
            this._baseAlpha = params.baseAlpha ?? 1;
            this._disabledColor = params.disabledColor ?? COLORS.BF_GREY_3;
            this._disabledAlpha = params.disabledAlpha ?? 1;
            this._pressedColor = params.pressedColor ?? COLORS.BF_GREEN_BRIGHT;
            this._pressedAlpha = params.pressedAlpha ?? 1;
            this._hoverColor = params.hoverColor ?? COLORS.BF_GREY_1;
            this._hoverAlpha = params.hoverAlpha ?? 1;
            this._focusedColor = params.focusedColor ?? COLORS.BF_GREY_1;
            this._focusedAlpha = params.focusedAlpha ?? 1;
            this._onClick = params.onClick;
            this._unregisterAsButton = registerButton(this._name, this);
        }
        public override delete(): void {
            this._unregisterAsButton();
            super.delete();
        }
        public get enabled(): boolean { return this._enabled; }
        public set enabled(enabled: boolean) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonEnabled(this._uiWidget, (this._enabled = enabled));
        }
        public setEnabled(enabled: boolean): this { this.enabled = enabled; return this; }
        public get baseColor(): mod.Vector { return this._baseColor; }
        public set baseColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonColorBase(this._uiWidget, (this._baseColor = color));
        }
        public setBaseColor(color: mod.Vector): this { this.baseColor = color; return this; }
        public get baseAlpha(): number { return this._baseAlpha; }
        public set baseAlpha(alpha: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonAlphaBase(this._uiWidget, (this._baseAlpha = alpha));
        }
        public setBaseAlpha(alpha: number): this { this.baseAlpha = alpha; return this; }
        public get disabledColor(): mod.Vector { return this._disabledColor; }
        public set disabledColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonColorDisabled(this._uiWidget, (this._disabledColor = color));
        }
        public setDisabledColor(color: mod.Vector): this { this.disabledColor = color; return this; }
        public get hoverColor(): mod.Vector { return this._hoverColor; }
        public set hoverColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonColorHover(this._uiWidget, (this._hoverColor = color));
        }
        public setHoverColor(color: mod.Vector): this { this.hoverColor = color; return this; }
        public get pressedColor(): mod.Vector { return this._pressedColor; }
        public set pressedColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonColorPressed(this._uiWidget, (this._pressedColor = color));
        }
        public setColorPressed(color: mod.Vector): this { this.pressedColor = color; return this; }
        public get focusedColor(): mod.Vector { return this._focusedColor; }
        public set focusedColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            mod.SetUIButtonColorFocused(this._uiWidget, (this._focusedColor = color));
        }
        public setFocusedColor(color: mod.Vector): this { this.focusedColor = color; return this; }
        public get onClick(): ((player: mod.Player) => Promise<void> | void) | undefined { return this._onClick; }
        public set onClick(onClick: ((player: mod.Player) => Promise<void> | void) | undefined) {
            if (this._isDeletedCheck()) return;
            this._onClick = onClick;
        }
        public setOnClick(onClick: ((player: mod.Player) => Promise<void> | void) | undefined): this { this.onClick = onClick; return this; }
    }
    export namespace UIButton {
        export type Params = ElementParams & {
            enabled?: boolean;
            baseColor?: mod.Vector;
            baseAlpha?: number;
            disabledColor?: mod.Vector;
            disabledAlpha?: number;
            pressedColor?: mod.Vector;
            pressedAlpha?: number;
            hoverColor?: mod.Vector;
            hoverAlpha?: number;
            focusedColor?: mod.Vector;
            focusedAlpha?: number;
            onClick?: (player: mod.Player) => Promise<void> | void;
        };
    }
    export abstract class UIContentButton<TContent extends Element, TContentProps extends readonly string[]>
        extends Element
    {
        protected _padding: number;
        protected _button: UIButton;
        protected _content: TContent;
        declare public baseColor: mod.Vector;
        declare public baseAlpha: number;
        declare public disabledColor: mod.Vector;
        declare public disabledAlpha: number;
        declare public pressedColor: mod.Vector;
        declare public pressedAlpha: number;
        declare public hoverColor: mod.Vector;
        declare public hoverAlpha: number;
        declare public focusedColor: mod.Vector;
        declare public focusedAlpha: number;
        declare public onClick: ((player: mod.Player) => Promise<void> | void) | undefined;
        declare public setBaseColor: (color: mod.Vector) => this;
        declare public setBaseAlpha: (alpha: number) => this;
        declare public setDisabledColor: (color: mod.Vector) => this;
        declare public setDisabledAlpha: (alpha: number) => this;
        declare public setPressedColor: (color: mod.Vector) => this;
        declare public setPressedAlpha: (alpha: number) => this;
        declare public setHoverColor: (color: mod.Vector) => this;
        declare public setHoverAlpha: (alpha: number) => this;
        declare public setFocusedColor: (color: mod.Vector) => this;
        declare public setFocusedAlpha: (alpha: number) => this;
        declare public setOnClick: (onClick: ((player: mod.Player) => Promise<void> | void) | undefined) => this;
        protected constructor(
            params: UIContentButton.Params,
            createContent: (parent: Parent, width: number, height: number) => TContent,
            contentProperties: TContentProps
        ) {
            const parent = params.parent ?? ROOT_NODE;
            const receiver = getReceiver(parent, params.receiver);
            const name = makeName(parent, receiver);
            const { x, y } = getPosition(params);
            const { width, height } = getSize(params);
            const depth = params.depth ?? mod.UIDepth.AboveGameUI;
            const padding = params.padding ?? 0;
            const containerElementParams: FinalElementParams = {
                name, parent,
                visible: params.visible ?? true,
                x, y, width, height,
                anchor: params.anchor ?? mod.UIAnchor.Center,
                bgColor: COLORS.WHITE,
                bgAlpha: 0,
                bgFill: mod.UIBgFill.None,
                depth,
                receiver,
                uiInputModeWhenVisible: params.uiInputModeWhenVisible ?? false,
            };
            const containerArgs: [string, mod.Vector, mod.Vector, mod.UIAnchor, mod.UIWidget, boolean, number, mod.Vector, number, mod.UIBgFill, mod.UIDepth] = [
                name,
                mod.CreateVector(x, y, 0),
                mod.CreateVector(width, height, 0),
                containerElementParams.anchor,
                parent.uiWidget,
                containerElementParams.visible,
                padding,
                containerElementParams.bgColor,
                containerElementParams.bgAlpha,
                containerElementParams.bgFill,
                containerElementParams.depth,
            ];
            if (receiver instanceof GlobalReceiver) {
                mod.AddUIContainer(...containerArgs);
            } else {
                mod.AddUIContainer(...containerArgs, receiver.nativeReceiver);
            }
            super(containerElementParams);
            this._padding = padding;
            const mockParent: Parent = {
                name: this._name,
                uiWidget: this._uiWidget,
                receiver: this._receiver,
                children: [],
                attachChild(_child: Element): void {},
                detachChild(_child: Element): void {},
            };
            const buttonParams: UIButton.Params = {
                parent: mockParent,
                width, height,
                bgColor: params.bgColor,
                bgAlpha: params.bgAlpha,
                bgFill: params.bgFill,
                enabled: params.enabled,
                baseColor: params.baseColor,
                baseAlpha: params.baseAlpha,
                disabledColor: params.disabledColor,
                disabledAlpha: params.disabledAlpha,
                pressedColor: params.pressedColor,
                pressedAlpha: params.pressedAlpha,
                hoverColor: params.hoverColor,
                hoverAlpha: params.hoverAlpha,
                focusedColor: params.focusedColor,
                focusedAlpha: params.focusedAlpha,
                depth,
                onClick: params.onClick,
            };
            this._button = new UIButton(buttonParams);
            const widthNetOfPadding = Math.max(0, width - padding * 2);
            const heightNetOfPadding = Math.max(0, height - padding * 2);
            this._content = createContent(mockParent, widthNetOfPadding, heightNetOfPadding);
            delegateProperties(this, this._button, [
                'bgColor', 'bgAlpha', 'bgFill',
                'baseColor', 'baseAlpha',
                'disabledColor', 'disabledAlpha',
                'pressedColor', 'pressedAlpha',
                'focusedAlpha', 'focusedColor',
                'hoverAlpha', 'hoverColor',
                'onClick',
            ]);
            delegateProperties(this, this._content, contentProperties);
        }
        public override delete(): void {
            this._button.delete();
            this._content.delete();
            super.delete();
        }
        public override get width(): number { return this._button.width; }
        public override set width(width: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector(width, this.height, 0));
            this._button.setWidth(width);
            this._content.setWidth(Math.max(0, width - this._padding * 2));
        }
        public override get height(): number { return this._button.height; }
        public override set height(height: number) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector(this.width, height, 0));
            this._button.setHeight(height);
            this._content.setHeight(Math.max(0, height - this._padding * 2));
        }
        public override get size(): Size { return { width: this._button.width, height: this._button.height }; }
        public override set size(params: Size) {
            if (this._isDeletedCheck()) return;
            mod.SetUIWidgetSize(this._uiWidget, mod.CreateVector(params.width, params.height, 0));
            this._button.setSize(params);
            this._content.setSize({
                width: Math.max(0, params.width - this._padding * 2),
                height: Math.max(0, params.height - this._padding * 2),
            });
        }
        public get enabled(): boolean { return this._button.enabled; }
        public set enabled(enabled: boolean) {
            if (this._isDeletedCheck()) return;
            this._button.enabled = enabled;
        }
        public setEnabled(enabled: boolean): this { this.enabled = enabled; return this; }
    }
    export namespace UIContentButton {
        export type Params = UIButton.Params & { padding?: number; };
    }
    const TEXT_BUTTON_CONTENT_PROPERTIES: readonly string[] = ['message', 'textSize', 'textAnchor'] as const;
    export class UITextButton extends UIContentButton<UIText, typeof TEXT_BUTTON_CONTENT_PROPERTIES> {
        declare public message: mod.Message;
        declare public textAnchor: mod.UIAnchor;
        declare public textSize: number;
        declare public setMessage: (message: mod.Message) => this;
        declare public setTextAnchor: (anchor: mod.UIAnchor) => this;
        declare public setTextSize: (size: number) => this;
        protected _textDisabledColor: mod.Vector;
        protected _textDisabledAlpha: number;
        public constructor(params: UITextButton.Params) {
            const createContent = (parent: Parent, width: number, height: number): UIText => {
                return new UIText({
                    parent, width, height,
                    message: params.message,
                    textSize: params.textSize,
                    textColor: params.textColor,
                    textAlpha: params.textAlpha,
                    textAnchor: params.textAnchor,
                    depth: params.depth,
                });
            };
            super(params, createContent, TEXT_BUTTON_CONTENT_PROPERTIES);
            this._textDisabledColor = params.textDisabledColor ?? COLORS.BF_GREY_2;
            this._textDisabledAlpha = params.textDisabledAlpha ?? 1;
            if (!this._button.enabled) {
                this._setContentEnabled(false);
            }
        }
        private _setContentEnabled(enabled: boolean): void {
            if (enabled) {
                mod.SetUITextColor(this._content.uiWidget, this._content.textColor);
                mod.SetUITextAlpha(this._content.uiWidget, this._content.textAlpha);
            } else {
                mod.SetUITextColor(this._content.uiWidget, this._textDisabledColor);
                mod.SetUITextAlpha(this._content.uiWidget, this._textDisabledAlpha);
            }
        }
        public override get enabled(): boolean { return this._button.enabled; }
        public override set enabled(enabled: boolean) {
            if (this._isDeletedCheck()) return;
            this._button.enabled = enabled;
            this._setContentEnabled(enabled);
        }
        public get textColor(): mod.Vector { return this._content.textColor; }
        public set textColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            this._content.textColor = color;
            if (this._button.enabled) mod.SetUITextColor(this._content.uiWidget, color);
        }
        public setTextColor(color: mod.Vector): this { this.textColor = color; return this; }
        public get textAlpha(): number { return this._content.textAlpha; }
        public set textAlpha(alpha: number) {
            if (this._isDeletedCheck()) return;
            this._content.textAlpha = alpha;
            if (this._button.enabled) mod.SetUITextAlpha(this._content.uiWidget, alpha);
        }
        public setTextAlpha(alpha: number): this { this.textAlpha = alpha; return this; }
        public get textDisabledColor(): mod.Vector { return this._textDisabledColor; }
        public set textDisabledColor(color: mod.Vector) {
            if (this._isDeletedCheck()) return;
            this._textDisabledColor = color;
            if (!this._button.enabled) mod.SetUITextColor(this._content.uiWidget, color);
        }
        public get textDisabledAlpha(): number { return this._textDisabledAlpha; }
        public set textDisabledAlpha(alpha: number) {
            if (this._isDeletedCheck()) return;
            this._textDisabledAlpha = alpha;
            if (!this._button.enabled) mod.SetUITextAlpha(this._content.uiWidget, alpha);
        }
    }
    export namespace UITextButton {
        export type Params = UIButton.Params & UIText.Params & {
            textDisabledColor?: mod.Vector;
            textDisabledAlpha?: number;
        };
    }
}


// Module: config/ConquestConfig.ts
namespace ConquestV8 {
    export const BUILD_ID = "2026-03-conquestv14"; // V14: Intro sequence
    const deployedPlayerIds: Set<number> = new Set();
    export const aiStatusByPlayerId: { [playerId: number]: boolean } = {};
    let lastAiCachePruneTime = -9999;
    const AI_CACHE_PRUNE_INTERVAL = 60.0; // Prune every 60s to prevent unbounded growth
    export const DEBUG_LOGS = false;  // OFF to save memory
    export const DEBUG_INTERVAL_SECONDS = 15.0;  // Throttle repeated messages (increased from 10s)
    export const DEBUG_AI_SPAWN = false;
    export const DEBUG_SKY_JETS = false;
    export const DEBUG_VEHICLE_UI = false;
    export const VEHICLE_UI_MODE: 'auto' | 'on' | 'off' = 'auto';
    export let INTRO_ENABLED = false;
    export let MAP_DISPLAY_NAME = "Unknown";
    export const FLIGHT_RECORDER_ENABLED = false;  // Toggle ON to record, OFF for normal play
    export const FOLLOW_CAMERA_ENABLED = false;     // Toggle ON to follow a player
    export const FOLLOW_CAMERA_HEIGHT = 5;           // metres above player
    export const FOLLOW_CAMERA_DISTANCE = 12;        // metres behind player
    export const FOLLOW_CAMERA_PITCH = 15;           // degrees looking down at player
    export const DEBUG_HOST_POPULATION_HUD = true;  // ON - show population on HUD
    export const USE_AUTOSPAWN_MODE = false;
    export const ENABLE_REPLACEMENT_SPAWN = true;
    export const REPLACEMENT_SPAWN_DELAY = 20.0;  // Seconds after death before replacement spawns (full bleedout window)
    export const MAX_REPLACEMENT_SPAWNS_PER_TICK = 2;  // Max replacements per tick (avoid quota)
    export const FORWARD_SPAWN_ENABLED = false;
    export const FORWARD_SPAWN_MAX_PER_TICK = 2;       // Max forward spawns per replacement tick
    export const FORWARD_SPAWN_CHANCE = 0.35;           // 35% chance a replacement spawns forward
    export const ERROR_LOG_THROTTLE_SECONDS = 2.0;
    const _lastDebugLogTimeByMessage: { [msg: string]: number } = {};
    const _lastDebugLogTimeByKey: { [key: string]: number } = {};
    const DEBUG_CACHE_MAX_ENTRIES = 100;
    let _debugCacheCount = 0;
    let _logCount = 0;
    const LOG_CAP = 5000;           // Max log lines per match before throttling
    const LOG_THROTTLE_INTERVAL = 50; // After cap, only log every Nth call
    export function log(msg: string): void {
        _logCount++;
        if (_logCount > LOG_CAP && _logCount % LOG_THROTTLE_INTERVAL !== 0) return;
        console.log(msg);
    }
    export function logDebug(msg: string): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByMessage[msg];
        if (last === undefined || t - last >= DEBUG_INTERVAL_SECONDS) {
            if (last === undefined) {
                _debugCacheCount++;
                if (_debugCacheCount > DEBUG_CACHE_MAX_ENTRIES) {
                    for (const k in _lastDebugLogTimeByMessage) delete _lastDebugLogTimeByMessage[k];
                    for (const k in _lastDebugLogTimeByKey) delete _lastDebugLogTimeByKey[k];
                    _debugCacheCount = 0;
                }
            }
            _lastDebugLogTimeByMessage[msg] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }
    export function logDebugKey(key: string, msg: string, intervalSeconds: number = DEBUG_INTERVAL_SECONDS): void {
        if (!DEBUG_LOGS) return;
        const t = mod.GetMatchTimeElapsed();
        const last = _lastDebugLogTimeByKey[key];
        if (last === undefined || t - last >= intervalSeconds) {
            _lastDebugLogTimeByKey[key] = t;
            console.log(`[ConquestV10][DEBUG] ${msg}`);
        }
    }
    export function logError(msg: string): void {
        console.log(`[ConquestV10][ERROR] ${msg}`);
    }
    export function safeCall(label: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            logError(`[safeCall:${label}] ${e}`);
        }
    }
    export const GAME_START_GRACE_PERIOD_SECONDS = 30;
    export const TICK_INTERVAL_SECONDS = 1.0;  // Main game loop tick rate
    export const OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS: number | null = 2700.0; // 45 minutes
    export const ENABLE_WIN_CONDITION_LOGS = true;
    export const TEAM_SIZE_TARGET = 24; // 24 scripted bots per team (avoids quota errors)
    export const RESERVED_HUMAN_SLOTS_PER_TEAM = 0;
    export const BOTS_PER_SPAWN_BATCH = 4;          // Spawn 4 bots per tick during pre-round
    export const PRE_ROUND_SPAWN_INTERVAL = 0.5;     // Spawn every 0.5 seconds during pre-round
    export const AI_SPAWN_DELAY_SECONDS = 5.0;
    export const AI_QUOTA_COOLDOWN_SECONDS = 10.0;
    export const SQUAD_SIZE = 4;                    // Bots per squad
    export const MIN_SQUAD_SIZE_FOR_ORDERS = 2;     // Minimum size to receive orders
    export const MAX_SQUADS_PER_OBJECTIVE = 2;      // Max squads assigned per objective (2 allows 8+ squads across 7 objectives)
    export const FORCE_OBJECTIVE_DIVERSITY = true;
    export const DIRECTOR_REASSIGNMENT_INTERVAL = 15.0; // Seconds between reassignments
    export const SET_STARTING_TICKETS_ON_ROUND_START = true;
    export const STARTING_TICKETS = 1500;
    export const TICKET_LOSS_DEATH = 1;           // Infantry death costs 1 ticket (matches template)
    export const TICKET_LOSS_REVIVE_REFUND = 1;   // Revive refunds 1 ticket (matches death cost)
    export const TICKET_LOSS_VEHICLE_LIGHT = 5;   // Quads, jeeps, light transports
    export const TICKET_LOSS_VEHICLE_HEAVY = 10;  // Tanks, IFVs
    export const TICKET_LOSS_VEHICLE_AIR = 15;    // Jets, helicopters
    export const TICKET_LOSS_VEHICLE_DEFAULT = 5; // Unknown vehicle types
    export const TICKET_LOSS_OBJECTIVE_CAPTURED = 5;  // Set to 0 to disable, or 30 for significant impact
    export const RESERVED_HUMAN_SLOTS = RESERVED_HUMAN_SLOTS_PER_TEAM;  // Alias
    export const TICKET_LOSS_ON_DEATH = TICKET_LOSS_DEATH;              // Alias
    export const TICKET_REFUND_ON_REVIVE = TICKET_LOSS_REVIVE_REFUND;  // Alias
    export const TICKET_BLEED_PER_FLAG_ADVANTAGE = 0.5; // Tickets lost per flag advantage per 1s tick (matches template: advantage per 2s tick)
    export const TOTAL_CONTROL_BLEED_BONUS = 5;
    export const CAPTURE_MAX_MULTIPLIER = 3;
    export const COLOUR_FILTER_MODE: 'none' | 'bf3' | 'bf4' | 'snow' = 'none';
    export const SCORE_PER_KILL_ASSIST = 25;   // Points for kill assist (template uses 5, we scale to our system)
    export const SCORE_VEHICLE_LIGHT = 100;      // Quadbike, GolfCart, Flyer60, Marauder
    export const SCORE_VEHICLE_TRANSPORT = 200;  // RHIB, transport variants
    export const SCORE_VEHICLE_IFV = 250;        // Bradley, Vector, CV90
    export const SCORE_VEHICLE_AA = 400;         // Cheetah, Gepard
    export const SCORE_VEHICLE_TANK = 500;       // Abrams, Leopard
    export const SCORE_VEHICLE_HELI = 600;       // UH60, AH64, Eurocopter
    export const SCORE_VEHICLE_JET = 1000;       // F16, F22, JAS39, SU57
    export const SCORE_VEHICLE_DEFAULT = 100;    // Unknown vehicle types
    export const TOTAL_PLAYERS_TARGET = 64;
    export const AI_BOT_MAX_HEALTH = 250;
    export const OBJECTIVE_RADIUS_METERS = 30.0;
    export const ENABLE_WAYPOINT_ROUTING = false;
    export const WAYPOINT_ARRIVAL_RADIUS = 50.0;  // Distance to objective before switching to combat behavior
    export const WAYPOINT_CHECK_INTERVAL = 2.0;   // How often (seconds) to check bot distance to objective
    export const WAYPOINT_TIMEOUT = 60.0;          // Max seconds on waypoint before forcing AIBattlefieldBehavior
    export const ENABLE_VEHICLE_SEEKING_SQUADS = false;  // ENABLED: Squads seek vehicles at HQ before objectives
    export const VEHICLE_SEEKING_SQUADS_PER_TEAM = 6;  // Increased from 4 (more vehicles)
    export const VEHICLE_SEEK_TIMEOUT_SECONDS = 15.0;  // Reduced from 30.0 - faster fallback to objectives
    export const AT_HQ_DISTANCE_METERS = 100.0;
    export const FULL_MAP_CONTROL_GRACE_SECONDS = 15.0;
    export const FULL_MAP_CONTROL_BLEED_MULTIPLIER = 3.0;
    export const ENABLE_AI_SKY_JETS = true;
    export const AI_SKY_JET_CHECK_INTERVAL_SECONDS = 8.0;
    export const AI_SKY_JET_SPAWN_COOLDOWN_SECONDS = 60.0;  // 60s cooldown to reduce Director state churn
    export const SKY_JET_BEHAVIOR_REFRESH_SECONDS = 3.0;    // Re-apply pilot behavior to prevent idle/bail
    export const MAX_SKY_JETS_PER_TEAM = 2;                 // 2 jets per team (4 total) for active air presence
    export const JET_PILOT_PICKUP_RADIUS_METERS = 400.0;    // Large radius to catch bots moving away from HQ
    export const ENABLE_ALL_JETS_AS_SKY_JETS = true;
    export const TEAM1_SKY_JET_SPAWNER_IDS = [232, 243];
    export const TEAM2_SKY_JET_SPAWNER_IDS = [247, 233];
    export function getSkyJetSpawnerIds(teamId: number): number[] {
        if (ENABLE_ALL_JETS_AS_SKY_JETS) {
            return teamId === 1 ? TEAM1_SKY_JET_SPAWNER_IDS : TEAM2_SKY_JET_SPAWNER_IDS;
        }
        return teamId === 1 ? [243] : [233];
    }
    export const ENABLE_VEHICLE_SEAT_FILLING = true;   // Enabled: seats AI into ground vehicles at HQ only
    export const VEHICLE_CHECK_INTERVAL_SECONDS = 5.0;  // Increased from 3.0 to reduce overhead
    export const VEHICLE_SEAT_FILL_RANGE_METERS = 15.0;  // Reduced: only grab bots very close to vehicles
    export const VEHICLE_AUTO_SEATING_WINDOW_SECONDS = 20.0;
    export const ENABLE_SEAT_TELEPORT_ASSIST = false;
    export const SEAT_TELEPORT_MAX_DISTANCE_METERS = 150.0;
    export const SEAT_TELEPORT_OFFSET_METERS = 1.5;
    export const TANK_HEALTH_MULTIPLIER = 0.5;    // Abrams, Leopard
    export const IFV_HEALTH_MULTIPLIER = 0.6;     // M2Bradley, CV90
    export const AA_HEALTH_MULTIPLIER = 0.7;      // Cheetah, Gepard
    export const MARAUDER_HEALTH_MULTIPLIER = 0.6; // Marauder, Marauder_Pax
    export const JET_PILOT_MAX_DISTANCE_METERS = 200.0;
    export const VEHICLE_DIRECTOR_START_DELAY_SECONDS = 10.0;
    export const ENABLE_VEHICLE_UNLOCK_ONCE = false;  // Disabled: was only for Downtown map testing, causes AI teleporting
    export const VEHICLE_UNLOCK_ONCE_DELAY_SECONDS = 30.0;
    export const ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR = true;
    export const ENABLE_GROUND_VEHICLE_INIT_SWEEP = true;
    export const GROUND_VEHICLE_INIT_INTERVAL_SECONDS = 30.0;
    export const ENABLE_SCRIPTED_GROUND_SPAWN = true;
    export const GROUND_SPAWN_DELAY_SECONDS = 10.0;
    export const ENABLE_SPAWNER_INIT_SWEEP = false;
    export const SPAWNER_INIT_INTERVAL_SECONDS = 30.0;
    export const SPAWNER_INIT_NEAR_DISTANCE_METERS = 80.0;
    export const ENABLE_VEHICLE_SEAT_DEBUG = false;
    export const VEHICLE_SEAT_DEBUG_INTERVAL_SECONDS = 5.0;
    export const ENABLE_HQ_JET_SEED_TELEPORT = false;  // Disabled: only HQ-proximate bots are eligible pilots
    export const PRESERVE_MAP_GROUND_AUTOSPAWN = true;
    export const ENABLE_GROUND_AUTOSPAWN_AFTER_DELAY = true;
    export const ENABLE_FORCE_HOST_SIDE = false;
    export const PREFERRED_STARTING_TEAM_ID: 0 | 1 | 2 = 0;
    export const PREFERRED_STARTING_FACTION: mod.Factions | null = null;
    let cachedTeam1Faction: mod.Factions | null = null;
    let cachedTeam2Faction: mod.Factions | null = null;
    let factionsCached = false;
    function detectAndCacheFactions(): void {
        if (factionsCached) return;
        factionsCached = true;
        try {
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);
            if (!team1 || !team2) {
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
                return;
            }
            const t1IsNato = mod.IsFaction(team1, mod.Factions.NATO);
            const t1IsPax = mod.IsFaction(team1, mod.Factions.PaxArmata);
            const t2IsNato = mod.IsFaction(team2, mod.Factions.NATO);
            const t2IsPax = mod.IsFaction(team2, mod.Factions.PaxArmata);
            if (t1IsNato && !t1IsPax) {
                cachedTeam1Faction = mod.Factions.NATO;
            } else if (t1IsPax && !t1IsNato) {
                cachedTeam1Faction = mod.Factions.PaxArmata;
            } else {
                cachedTeam1Faction = mod.Factions.NATO;
            }
            if (t2IsPax && !t2IsNato) {
                cachedTeam2Faction = mod.Factions.PaxArmata;
            } else if (t2IsNato && !t2IsPax) {
                cachedTeam2Faction = mod.Factions.NATO;
            } else {
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }
            if (cachedTeam1Faction === cachedTeam2Faction) {
                cachedTeam1Faction = mod.Factions.NATO;
                cachedTeam2Faction = mod.Factions.PaxArmata;
            }
        } catch (_e) {
            cachedTeam1Faction = mod.Factions.NATO;
            cachedTeam2Faction = mod.Factions.PaxArmata;
        }
    }
    export function resetFactionCache(): void {
        cachedTeam1Faction = null;
        cachedTeam2Faction = null;
        factionsCached = false;
    }
    export function getTeamFaction(teamId: number): mod.Factions | null {
        detectAndCacheFactions();
        if (teamId === 1) return cachedTeam1Faction;
        if (teamId === 2) return cachedTeam2Faction;
        return null;
    }
    export function factionLabel(f: mod.Factions | null): string {
        if (f === mod.Factions.NATO) return "NATO";
        if (f === mod.Factions.PaxArmata) return "PAX";
        return "UNKNOWN";
    }
    export function getTeamFactionLabel(teamId: number): string {
        return factionLabel(getTeamFaction(teamId));
    }
    export function getPreferredTeamId(): number {
        let desiredTeamId: number = 0;
        if (PREFERRED_STARTING_TEAM_ID === 1 || PREFERRED_STARTING_TEAM_ID === 2) {
            desiredTeamId = PREFERRED_STARTING_TEAM_ID;
        } else if (PREFERRED_STARTING_FACTION !== null) {
            const team1Faction = getTeamFaction(1);
            const team2Faction = getTeamFaction(2);
            if (team1Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 1;
            if (team2Faction === PREFERRED_STARTING_FACTION) desiredTeamId = 2;
            if (!desiredTeamId) {
                desiredTeamId = PREFERRED_STARTING_FACTION === mod.Factions.PaxArmata ? 2 : 1;
            }
        }
        return desiredTeamId;
    }
    export function tryForceHostToPreferredSide(): void {
        if (!ENABLE_FORCE_HOST_SIDE) return;
        const host = tryGetHostPlayer();
        if (!host) return;
        try {
            if (!mod.IsPlayerValid(host)) return;
        } catch (_e) {
        }
        const desiredTeamId = getPreferredTeamId();
        if (desiredTeamId !== 1 && desiredTeamId !== 2) return;
        const currentTeamId = getPlayerTeamId(host);
        if (currentTeamId === desiredTeamId) return;
        const desiredTeam = mod.GetTeam(desiredTeamId);
        if (!desiredTeam) return;
        log(
            `[ConquestV10] Forcing host to Team ${desiredTeamId} (${getTeamFactionLabel(desiredTeamId)}) from Team ${currentTeamId} (${getTeamFactionLabel(currentTeamId)}) prefFaction=${factionLabel(
                PREFERRED_STARTING_FACTION
            )}`
        );
        safeCall("TeamSetup:SetTeam", () => mod.SetTeam(host, desiredTeam));
    }
    export const ENABLE_SCRIPTED_AI_SPAWNING = true;
    export const SCRIPTED_AI_SPAWN_START_DELAY_SECONDS = 1.0;
    export const ENABLE_AI_ORDERS = true;
    export const DIRECTOR_INTERVAL_SECONDS = 2.5;
    export const BOT_MOVE_COMMAND_INTERVAL_SECONDS = 8.0;
    export const STOP_ORDERS_WHEN_IN_VEHICLE = true;
    export type Objective = { 
        id: string; 
        name: string; 
        objId: number; 
        x: number; 
        y: number; 
        z: number; 
        waypointPathId?: number;
        approachPoint?: { x: number; y: number; z: number };
        isRooftop?: boolean;
    };
    const GRANITE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -1104.93, y: 145.185, z: -24.5901, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -1044.08, y: 184.322, z: -130.076, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: -1041.81, y: 144.489, z: 161.46, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: -878.344, y: 177.913, z: 41.9978, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -1248.85, y: 127.857, z: 75.4271, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: -912.492, y: 142.426, z: 205.425, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -1082.37, y: 142.426, z: 321.619, waypointPathId: 807, isRooftop: false },
    ];
    const CAPSTONE_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: 533.339, y: 144.579, z: 160.168, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: 377.991, y: 87.9316, z: 109.611, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 191.581, y: 89.9122, z: -121.593, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: 17.9395, y: 123.376, z: -183.508, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -224.563, y: 119.736, z: -106.128, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: 456.145, y: 88.003, z: 298.109, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -92.9837, y: 94.7251, z: -49.348, waypointPathId: 807, isRooftop: false },
    ];
    const PORTAL_SAND_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: 113, y: 44, z: -194, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: 115, y: 44, z: -10, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 155, y: 43.098, z: 186, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: -13, y: 44, z: 10, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: -133, y: 44, z: -218, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: -178, y: 44, z: -60, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -166, y: 44, z: 134, waypointPathId: 807, isRooftop: false },
    ];
    const EASTWOOD_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha", objId: 601, x: -162.38, y: 262.129, z: 94.56, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo", objId: 602, x: -152.8, y: 252.625, z: -76.32, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 68.367, y: 254.909, z: 16.794, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta", objId: 604, x: -245.989, y: 251.208, z: 5.455, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo", objId: 605, x: 193.17, y: 253.621, z: -168.23, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: -113.59, y: 253.861, z: 22.13, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf", objId: 607, x: -70.19, y: 256.644, z: 171.88, waypointPathId: 807, isRooftop: false },
    ];
    const BADLANDS_OBJECTIVES: Objective[] = [
        { id: "A", name: "Alpha",   objId: 601, x: 395.454, y: 123.0, z: -384.853, waypointPathId: 801, isRooftop: false },
        { id: "B", name: "Bravo",   objId: 602, x: 211.454, y: 120.0, z: -382.853, waypointPathId: 802, isRooftop: false },
        { id: "C", name: "Charlie", objId: 603, x: 332.454, y: 109.1, z: -515.853, waypointPathId: 803, isRooftop: false },
        { id: "D", name: "Delta",   objId: 604, x: 191.454, y: 112.0, z: -555.853, waypointPathId: 804, isRooftop: false },
        { id: "E", name: "Echo",    objId: 605, x: 419.454, y: 137.0, z: -630.853, waypointPathId: 805, isRooftop: false },
        { id: "F", name: "Foxtrot", objId: 606, x: 261.454, y: 124.0, z: -675.853, waypointPathId: 806, isRooftop: false },
        { id: "G", name: "Golf",    objId: 607, x:  67.454, y: 132.0, z: -663.853, waypointPathId: 807, isRooftop: false },
    ];
    export let OBJECTIVES: Objective[] = [];
    export let HQ1_POS = { x: 0, y: 100, z: 0 };
    export let HQ2_POS = { x: 0, y: 100, z: 0 };
    export interface FlybyWaypoint {
        x: number;
        y: number;
        z: number;
        pitch?: number;  // camera pitch (Euler X)
        yaw?: number;    // camera yaw (Euler Y)
        roll?: number;   // camera roll (Euler Z)
    }
    const BADLANDS_FLYBY: FlybyWaypoint[] = [
        { x: 298,   y: 85,    z: -118,   pitch: 30,    yaw: -180,   roll: 0 },     // Start near HQ1
        { x: 422,   y: 125,   z: -352,   pitch: 30,    yaw: 165,    roll: 0 },     // Approach A
        { x: 460,   y: 125,   z: -352,   pitch: 30,    yaw: -135,   roll: 0 },     // Past A, looking back
        { x: 460,   y: 125,   z: -390,   pitch: 30,    yaw: -90,    roll: 0 },     // Slide south
        { x: 242,   y: 125,   z: -390,   pitch: 30,    yaw: -75,    roll: 0 },     // Toward B
        { x: 210,   y: 125,   z: -405,   pitch: 30,    yaw: 0,      roll: 0 },     // At B
        { x: 187,   y: 125,   z: -379,   pitch: 30,    yaw: 85,     roll: 0 },     // Past B north
        { x: 187,   y: 125,   z: -359,   pitch: 30,    yaw: 130,    roll: 0 },     // Looking back at B
        { x: 310,   y: 125,   z: -492,   pitch: 30,    yaw: 130,    roll: 0 },     // Toward C
        { x: 354,   y: 125,   z: -492,   pitch: 30,    yaw: -140,   roll: 0 },     // At C looking back
        { x: 354,   y: 125,   z: -515,   pitch: 30,    yaw: -95,    roll: 0 },     // Leave C toward D
        { x: 239,   y: 125,   z: -542.9, pitch: 30,    yaw: -95,    roll: 0 },     // Approach D
        { x: 201,   y: 125,   z: -513.9, pitch: 30,    yaw: -180,   roll: 0 },     // At D
        { x: 168,   y: 125,   z: -548.9, pitch: 30,    yaw: 90,     roll: 0 },     // Past D
        { x: 360,   y: 151,   z: -555.9, pitch: 30,    yaw: 105,    roll: 0 },     // Toward E high
        { x: 413,   y: 133.3, z: -555.9, pitch: 10,    yaw: -180,   roll: 0 },     // Near E
        { x: 413,   y: 133.3, z: -595.9, pitch: 10,    yaw: 160,    roll: 0 },     // Through warehouse
        { x: 425,   y: 133.3, z: -633.9, pitch: -34.3, yaw: -168.1, roll: -8.5 },  // Looking toward F
        { x: 425,   y: 133.3, z: -633.9, pitch: -34.3, yaw: -123.1, roll: -8.5 },  // Turn toward F
        { x: 374.4, y: 176.3, z: -664.9, pitch: 31.1,  yaw: -99.6,  roll: 2.1 },   // Over hill at F
        { x: 133,   y: 155.8, z: -670.9, pitch: 30.9,  yaw: -91.4,  roll: -0.9 },  // Past F toward G
        { x: -14,   y: 155.8, z: -611.9, pitch: 30.9,  yaw: -61.4,  roll: -0.9 },  // Past G
        { x: -199,  y: 155.8, z: -503.9, pitch: 30.9,  yaw: -36.4,  roll: -0.9 },  // End near HQ2
    ];
    const SAND_FLYBY: FlybyWaypoint[] = [
        { x: 160,  y: 180, z: -180, pitch: 30, yaw: -45, roll: 0 },   // Start east, high
        { x: 80,   y: 160, z: -100, pitch: 25, yaw: -45, roll: 0 },   // Over Alpha/Bravo area
        { x: 0,    y: 150, z: -10,  pitch: 25, yaw: -48, roll: 0 },   // Over Delta (center)
        { x: -100, y: 155, z: 60,   pitch: 25, yaw: -50, roll: 0 },   // Over Foxtrot/Golf
        { x: -200, y: 170, z: 150,  pitch: 30, yaw: -50, roll: 0 },   // Toward HQ1
    ];
    const CAPSTONE_FLYBY: FlybyWaypoint[] = [
        { x: -435, y: 250, z: 38,   pitch: 25, yaw: 90,  roll: 0 },   // Start west of HQ1
        { x: -224, y: 230, z: -106, pitch: 25, yaw: 100, roll: 0 },   // Over Echo
        { x: -92,  y: 220, z: -49,  pitch: 25, yaw: 90,  roll: 0 },   // Over Golf
        { x: 17,   y: 225, z: -183, pitch: 25, yaw: 70,  roll: 0 },   // Over Delta
        { x: 191,  y: 220, z: -121, pitch: 25, yaw: 60,  roll: 0 },   // Over Charlie
        { x: 377,  y: 210, z: 109,  pitch: 25, yaw: 40,  roll: 0 },   // Over Bravo
        { x: 533,  y: 240, z: 160,  pitch: 25, yaw: 20,  roll: 0 },   // Over Alpha (highest terrain)
        { x: 523,  y: 200, z: 367,  pitch: 30, yaw: 0,   roll: 0 },   // Toward HQ2/Foxtrot
    ];
    export let FLYBY_WAYPOINTS: FlybyWaypoint[] = [];
    let mapConfigInitialized = false;
    let currentMapName = "Unknown";
    export function initializeMapConfig(): void {
        if (mapConfigInitialized) return;
        mapConfigInitialized = true;
        try {
            if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                OBJECTIVES = GRANITE_OBJECTIVES;
                HQ1_POS = { x: -1293, y: 138, z: -238 };
                HQ2_POS = { x: -772, y: 143, z: 468 };
                MAP_DISPLAY_NAME = "Downtown";
                currentMapName = "Granite_MainStreet";
                log(`[ConquestV10] Map detected: Granite Downtown - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                OBJECTIVES = CAPSTONE_OBJECTIVES;
                HQ1_POS = { x: -401, y: 153, z: 17 };
                HQ2_POS = { x: 523, y: 93, z: 485 };
                FLYBY_WAYPOINTS = CAPSTONE_FLYBY;
                MAP_DISPLAY_NAME = "Liberation The Gully";
                currentMapName = "Capstone";
                log(`[ConquestV10] Map detected: Capstone - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Sand)) {
                OBJECTIVES = PORTAL_SAND_OBJECTIVES;
                HQ1_POS = { x: -427, y: 55, z: 290 };
                HQ2_POS = { x: 464, y: 38, z: -207 };
                FLYBY_WAYPOINTS = SAND_FLYBY;
                MAP_DISPLAY_NAME = "Portal Sands";
                currentMapName = "Portal_Sand";
                log(`[ConquestV10] Map detected: Portal Sandbox - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                OBJECTIVES = EASTWOOD_OBJECTIVES;
                HQ1_POS = { x: -524, y: 309, z: -190 };
                HQ2_POS = { x: 291, y: 230, z: 217 };
                MAP_DISPLAY_NAME = "Eastwood";
                currentMapName = "Eastwood";
                log(`[ConquestV10] Map detected: Eastwood - ${OBJECTIVES.length} objectives loaded`);
            }
            else if (mod.IsCurrentMap(mod.Maps.Badlands)) {
                OBJECTIVES = BADLANDS_OBJECTIVES;
                HQ1_POS = { x: 291, y: 97, z: -130 };
                HQ2_POS = { x: -167, y: 93, z: -597 };
                FLYBY_WAYPOINTS = BADLANDS_FLYBY;
                MAP_DISPLAY_NAME = "Blackwell Hills";
                CAPTURE_REWARDS = BADLANDS_CAPTURE_REWARDS;
                currentMapName = "Badlands";
                log(`[ConquestV10] Map detected: Badlands - ${OBJECTIVES.length} objectives loaded`);
            }
            else {
                let detected = false;
                if (!detected) {
                    try {
                        const probe = mod.GetVehicleSpawner(300);
                        if (probe) {
                            OBJECTIVES = BADLANDS_OBJECTIVES;
                            HQ1_POS = { x: 291, y: 97, z: -130 };
                            HQ2_POS = { x: -167, y: 93, z: -597 };
                            FLYBY_WAYPOINTS = BADLANDS_FLYBY;
                            MAP_DISPLAY_NAME = "Blackwell Hills";
                            CAPTURE_REWARDS = BADLANDS_CAPTURE_REWARDS;
                            currentMapName = "Badlands";
                            detected = true;
                            log(`[ConquestV10] Map detected via ObjId probe: Badlands`);
                        }
                    } catch (_e) { /* not Badlands */ }
                }
                if (!detected) {
                    try {
                        const probe = mod.GetVehicleSpawner(232);
                        if (probe) {
                            OBJECTIVES = EASTWOOD_OBJECTIVES;
                            HQ1_POS = { x: -524, y: 309, z: -190 };
                            HQ2_POS = { x: 291, y: 230, z: 217 };
                            MAP_DISPLAY_NAME = "Eastwood";
                            currentMapName = "Eastwood";
                            detected = true;
                            log(`[ConquestV10] Map detected via ObjId probe: Eastwood`);
                        }
                    } catch (_e) { /* not Eastwood */ }
                }
                if (!detected) {
                    try {
                        const cpA = mod.GetCapturePoint(601);
                        if (cpA) {
                            const pos = mod.GetObjectPosition(cpA as unknown as mod.Object);
                            if (pos && mod.XComponentOf(pos) > 400) {
                                OBJECTIVES = CAPSTONE_OBJECTIVES;
                                HQ1_POS = { x: -401, y: 153, z: 17 };
                                HQ2_POS = { x: 523, y: 93, z: 485 };
                                FLYBY_WAYPOINTS = CAPSTONE_FLYBY;
                                MAP_DISPLAY_NAME = "Liberation The Gully";
                                currentMapName = "Capstone";
                                detected = true;
                                log(`[ConquestV10] Map detected via position probe: Capstone`);
                            }
                        }
                    } catch (_e) { /* probe failed */ }
                }
                if (!detected) {
                    OBJECTIVES = GRANITE_OBJECTIVES;
                    HQ1_POS = { x: -1293, y: 138, z: -238 };
                    HQ2_POS = { x: -772, y: 143, z: 468 };
                    currentMapName = "Unknown (fallback to Granite)";
                    log(`[ConquestV10] Unknown map - falling back to Granite Downtown config`);
                }
            }
        } catch (_e) {
            OBJECTIVES = GRANITE_OBJECTIVES;
            HQ1_POS = { x: -1293, y: 138, z: -238 };
            HQ2_POS = { x: -772, y: 143, z: 468 };
            currentMapName = "Error (fallback to Granite)";
            logError(`[ConquestV10] Failed to detect map - falling back to Granite Downtown config`);
        }
    }
    export function getCurrentMapName(): string {
        return currentMapName;
    }
    export function getObjectiveByLetter(letter: string): Objective | null {
        return OBJECTIVES.find((o) => o.id === letter) ?? null;
    }
    export function getObjectiveByObjId(objId: number): Objective | null {
        return OBJECTIVES.find((o) => o.objId === objId) ?? null;
    }
    export type CaptureReward = { capturePointObjId: number; spawnerObjId: number; label: string };
    const BADLANDS_CAPTURE_REWARDS: CaptureReward[] = [
        { capturePointObjId: 604, spawnerObjId: 300, label: "Leopard at Delta" },
    ];
    export let CAPTURE_REWARDS: CaptureReward[] = [];
    export function isRooftopObjective(letter: string): boolean {
        const obj = getObjectiveByLetter(letter);
        return obj?.isRooftop === true;
    }
    export function getApproachPoint(letter: string): { x: number; y: number; z: number } | null {
        const obj = getObjectiveByLetter(letter);
        return obj?.approachPoint ?? null;
    }
    export const TEAM1_AI_SPAWNER_IDS = [1092, 1091, 1090, 1093];
    export const TEAM2_AI_SPAWNER_IDS = [1002, 1003, 1004, 1005];
    export const TEAM1_OBJ_SPAWNER_IDS: number[] = [4101, 4102, 4103, 4104, 4105, 4106, 4107];
    export const TEAM2_OBJ_SPAWNER_IDS: number[] = [4201, 4202, 4203, 4204, 4205, 4206, 4207];
    export function getObjectiveSpawnerId(teamId: number, objectiveIndex: number): number | null {
        const ids = teamId === 1 ? TEAM1_OBJ_SPAWNER_IDS : TEAM2_OBJ_SPAWNER_IDS;
        if (objectiveIndex < 0 || objectiveIndex >= ids.length) return null;
        return ids[objectiveIndex];
    }
    export function createPos(x: number, y: number, z: number): mod.Vector {
        return mod.CreateVector(x, y, z);
    }
    export function textMessage(text: string): mod.Message {
        return mod.Message("{}", text);
    }
    export const CAPTURE_RADIUS_METERS = 40.0;
    export const CAPTURE_TIME_SECONDS = 10.0;  // Reduced from 15.0 for faster captures
    export const NEUTRALIZE_TIME_SECONDS = 10.0;  // Reduced from 7.5 for faster neutralization
    export const ENABLE_OBJECTIVE_ENTER_EXIT_SFX = true;
    export const ENABLE_CAPTURE_TICK_SFX = true;
    export const ENABLE_CAPTURE_TICK_LOOP_SFX = true;
    export const ENABLE_CAPTURE_LEADIN_SFX = false;
    export const ENABLE_CONTESTED_SFX = true;
    export const ENABLE_GAMEPLAY_HUD = true;
    export const ENABLE_SCOREBOARD = true;
    export const HUD_COLOR_MODE: "absolute" | "perspective" = "absolute";
    export const SCOREBOARD_UPDATE_INTERVAL_SECONDS = 2.0;
    export const SCOREBOARD_CAPTURES_LABEL = "C";
    export function markPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        try {
            const pid = mod.GetObjId(player);
            deployedPlayerIds.add(pid);
            logDebug(`[Deployed] Player ${pid} marked as deployed. Total deployed: ${deployedPlayerIds.size}`);
        } catch (_e) {
            logDebug(`[Deployed] Failed to mark player as deployed: ${_e}`);
        }
    }
    export function markPlayerUndeployed(player: mod.Player): void {
        if (!player) return;
        try {
            const pid = mod.GetObjId(player);
            if (pid < 0) return;  // Invalid player reference - skip silently
            const wasDeployed = deployedPlayerIds.has(pid);
            deployedPlayerIds.delete(pid);
            logDebug(`[Undeployed] Player ${pid} marked as undeployed (was=${wasDeployed}). Total deployed: ${deployedPlayerIds.size}`);
        } catch (_e) {
            logDebug(`[Undeployed] Failed to mark player as undeployed: ${_e}`);
        }
    }
    function pruneAiStatusCache(): void {
        const t = mod.GetMatchTimeElapsed();
        if (t - lastAiCachePruneTime < AI_CACHE_PRUNE_INTERVAL) return;
        lastAiCachePruneTime = t;
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            const activeIds = new Set<number>();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                try { activeIds.add(mod.GetObjId(p)); } catch (_e) { /* skip */ }
            }
            for (const key of Object.keys(aiStatusByPlayerId)) {
                const id = Number(key);
                if (!activeIds.has(id)) {
                    delete aiStatusByPlayerId[id];
                }
            }
        } catch (_e) { /* skip */ }
    }
    export function isAISoldier(player: mod.Player): boolean {
        if (!player) return false;
        pruneAiStatusCache();
        let pid = -1;
        try {
            pid = mod.GetObjId(player);
        } catch (_e) {
            return false;
        }
        if (!deployedPlayerIds.has(pid)) {
            return aiStatusByPlayerId[pid] ?? false;
        }
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            aiStatusByPlayerId[pid] = isAI;
            return isAI;
        } catch (_e) {
            markPlayerUndeployed(player);
            return aiStatusByPlayerId[pid] ?? false;
        }
    }
    export function isAlive(player: mod.Player): boolean {
        if (!hasSoldier(player)) return false;
        try {
            return mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
        } catch (_e) {
            try {
                markPlayerUndeployed(player);
            } catch (_e2) {
            }
            return false;
        }
    }
    export function hasSoldier(player: mod.Player): boolean {
        if (!player) return false;
        try {
            const pid = mod.GetObjId(player);
            return deployedPlayerIds.has(pid);
        } catch (_e) {
            return false;
        }
    }
    export function getPlayerTeamId(player: mod.Player): number {
        try {
            const playerTeam = mod.GetTeam(player);
            if (!playerTeam) return 0;
            const team1 = mod.GetTeam(1);
            const team2 = mod.GetTeam(2);
            const playerTeamObjId = mod.GetObjId(playerTeam);
            if (team1 && mod.GetObjId(team1) === playerTeamObjId) return 1;
            if (team2 && mod.GetObjId(team2) === playerTeamObjId) return 2;
            return 0;
        } catch (_e) {
            return 0;
        }
    }
    export function distance(a: mod.Vector, b: mod.Vector): number {
        const dx = mod.XComponentOf(a) - mod.XComponentOf(b);
        const dy = mod.YComponentOf(a) - mod.YComponentOf(b);
        const dz = mod.ZComponentOf(a) - mod.ZComponentOf(b);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    export function tryGetHostPlayer(): mod.Player | null {
        try {
            const all = mod.AllPlayers();
            const count = mod.CountOf(all);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && mod.GetObjId(p) === 0 && !isAISoldier(p)) {
                    return p;
                }
            }
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(all, i) as mod.Player;
                if (p && !isAISoldier(p)) {
                    return p;
                }
            }
        } catch (_e) {
        }
        return null;
    }
    let GAME_TIME_SECONDS = 0;
    let LAST_RAW_ROUND_TIME: number | null = null;
    let ROUND_TIME_DIRECTION = 0; // 0 unknown, 1 increasing, -1 decreasing
    let FALLBACK_CLOCK_ACCUM = 0;
    const FALLBACK_ADVANCE_STEP = TICK_INTERVAL_SECONDS * 0.25;
    let LAST_FORCE_ADVANCE_RAW: number | null = null;
    export function resetGameClock(): void {
        GAME_TIME_SECONDS = 0;
        LAST_RAW_ROUND_TIME = null;
        ROUND_TIME_DIRECTION = 0;
        FALLBACK_CLOCK_ACCUM = 0;
        LAST_FORCE_ADVANCE_RAW = null;
    }
    function updateGameClock(forceAdvance: boolean): void {
        const raw = mod.GetMatchTimeElapsed();
        if (forceAdvance) {
            if (LAST_FORCE_ADVANCE_RAW !== null && raw === LAST_FORCE_ADVANCE_RAW) {
                forceAdvance = false;
            } else {
                LAST_FORCE_ADVANCE_RAW = raw;
            }
        }
        if (LAST_RAW_ROUND_TIME === null) {
            LAST_RAW_ROUND_TIME = raw;
            if (forceAdvance && GAME_TIME_SECONDS === 0) {
                FALLBACK_CLOCK_ACCUM += FALLBACK_ADVANCE_STEP;
                if (FALLBACK_CLOCK_ACCUM >= TICK_INTERVAL_SECONDS) {
                    GAME_TIME_SECONDS += TICK_INTERVAL_SECONDS;
                    FALLBACK_CLOCK_ACCUM -= TICK_INTERVAL_SECONDS;
                }
            }
            return;
        }
        const delta = raw - LAST_RAW_ROUND_TIME;
        if (ROUND_TIME_DIRECTION === 0) {
            if (delta > 0) {
                ROUND_TIME_DIRECTION = 1;
            } else if (delta < 0) {
                ROUND_TIME_DIRECTION = -1;
            }
        }
        let adjusted = 0;
        if (ROUND_TIME_DIRECTION === -1) {
            adjusted = LAST_RAW_ROUND_TIME - raw;
        } else {
            adjusted = raw - LAST_RAW_ROUND_TIME;
        }
        if (adjusted < 0) {
            adjusted = -adjusted;
        }
        if (adjusted > 0) {
            GAME_TIME_SECONDS += adjusted;
            FALLBACK_CLOCK_ACCUM = 0;
        } else if (forceAdvance) {
            FALLBACK_CLOCK_ACCUM += FALLBACK_ADVANCE_STEP;
            if (FALLBACK_CLOCK_ACCUM >= TICK_INTERVAL_SECONDS) {
                GAME_TIME_SECONDS += TICK_INTERVAL_SECONDS;
                FALLBACK_CLOCK_ACCUM -= TICK_INTERVAL_SECONDS;
            }
        }
        LAST_RAW_ROUND_TIME = raw;
    }
    export function now(_forceAdvance?: boolean): number {
        try {
            return mod.GetMatchTimeElapsed();
        } catch (_e) {
            return 0;
        }
    }
    export function getTickets(teamId: number): number {
        return Registry_GetTickets(teamId);
    }
    type UIVector = mod.Vector | number[];
    interface UIParams {
        name: string;
        type: string;
        position: any;
        size: any;
        anchor: mod.UIAnchor;
        parent: mod.UIWidget;
        visible: boolean;
        textLabel: string;
        textColor: UIVector;
        textAlpha: number;
        textSize: number;
        textAnchor: mod.UIAnchor;
        padding: number;
        bgColor: UIVector;
        bgAlpha: number;
        bgFill: mod.UIBgFill;
        imageType: mod.UIImageType;
        imageColor: UIVector;
        imageAlpha: number;
        teamId?: mod.Team;
        playerId?: mod.Player;
        children?: any[];
        buttonEnabled: boolean;
        buttonColorBase: UIVector;
        buttonAlphaBase: number;
        buttonColorDisabled: UIVector;
        buttonAlphaDisabled: number;
        buttonColorPressed: UIVector;
        buttonAlphaPressed: number;
        buttonColorHover: UIVector;
        buttonAlphaHover: number;
        buttonColorFocused: UIVector;
        buttonAlphaFocused: number;
    }
    function __asModVector(param: number[] | mod.Vector) {
        if (Array.isArray(param)) return mod.CreateVector(param[0], param[1], param.length == 2 ? 0 : param[2]);
        else return param;
    }
    function __asModMessage(param: string | mod.Message) {
        if (typeof param === 'string') return mod.Message(param);
        return param;
    }
    function __fillInDefaultArgs(params: UIParams) {
        if (!params.hasOwnProperty('name')) params.name = '';
        if (!params.hasOwnProperty('position')) params.position = mod.CreateVector(0, 0, 0);
        if (!params.hasOwnProperty('size')) params.size = mod.CreateVector(100, 100, 0);
        if (!params.hasOwnProperty('anchor')) params.anchor = mod.UIAnchor.TopLeft;
        if (!params.hasOwnProperty('parent')) params.parent = mod.GetUIRoot();
        if (!params.hasOwnProperty('visible')) params.visible = true;
        if (!params.hasOwnProperty('padding')) params.padding = params.type == 'Container' ? 0 : 8;
        if (!params.hasOwnProperty('bgColor')) params.bgColor = mod.CreateVector(0.25, 0.25, 0.25);
        if (!params.hasOwnProperty('bgAlpha')) params.bgAlpha = 0.5;
        if (!params.hasOwnProperty('bgFill')) params.bgFill = mod.UIBgFill.Solid;
    }
    function __setNameAndGetWidget(uniqueName: any, params: any) {
        const widget = mod.FindUIWidgetWithName(uniqueName) as mod.UIWidget;
        mod.SetUIWidgetName(widget, params.name);
        return widget;
    }
    const __cUniqueName = '----uniquename----';
    function __addUIContainer(params: UIParams) {
        __fillInDefaultArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIContainer(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                restrict
            );
        } else {
            mod.AddUIContainer(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill
            );
        }
        const widget = __setNameAndGetWidget(__cUniqueName, params);
        if (params.children) {
            params.children.forEach((childParams: any) => {
                childParams.parent = widget;
                __addUIWidget(childParams);
            });
        }
        return widget;
    }
    function __fillInDefaultTextArgs(params: UIParams) {
        if (!params.hasOwnProperty('textLabel')) params.textLabel = '';
        if (!params.hasOwnProperty('textSize')) params.textSize = 0;
        if (!params.hasOwnProperty('textColor')) params.textColor = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('textAlpha')) params.textAlpha = 1;
        if (!params.hasOwnProperty('textAnchor')) params.textAnchor = mod.UIAnchor.CenterLeft;
    }
    function __addUIText(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultTextArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIText(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                __asModMessage(params.textLabel),
                params.textSize,
                __asModVector(params.textColor),
                params.textAlpha,
                params.textAnchor,
                restrict
            );
        } else {
            mod.AddUIText(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                __asModMessage(params.textLabel),
                params.textSize,
                __asModVector(params.textColor),
                params.textAlpha,
                params.textAnchor
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }
    function __fillInDefaultImageArgs(params: any) {
        if (!params.hasOwnProperty('imageType')) params.imageType = mod.UIImageType.None;
        if (!params.hasOwnProperty('imageColor')) params.imageColor = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('imageAlpha')) params.imageAlpha = 1;
    }
    function __addUIImage(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultImageArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIImage(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.imageType,
                __asModVector(params.imageColor),
                params.imageAlpha,
                restrict
            );
        } else {
            mod.AddUIImage(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.imageType,
                __asModVector(params.imageColor),
                params.imageAlpha
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }
    function __fillInDefaultButtonArgs(params: any) {
        if (!params.hasOwnProperty('buttonEnabled')) params.buttonEnabled = true;
        if (!params.hasOwnProperty('buttonColorBase')) params.buttonColorBase = mod.CreateVector(0.7, 0.7, 0.7);
        if (!params.hasOwnProperty('buttonAlphaBase')) params.buttonAlphaBase = 1;
        if (!params.hasOwnProperty('buttonColorDisabled')) params.buttonColorDisabled = mod.CreateVector(0.2, 0.2, 0.2);
        if (!params.hasOwnProperty('buttonAlphaDisabled')) params.buttonAlphaDisabled = 0.5;
        if (!params.hasOwnProperty('buttonColorPressed')) params.buttonColorPressed = mod.CreateVector(0.25, 0.25, 0.25);
        if (!params.hasOwnProperty('buttonAlphaPressed')) params.buttonAlphaPressed = 1;
        if (!params.hasOwnProperty('buttonColorHover')) params.buttonColorHover = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('buttonAlphaHover')) params.buttonAlphaHover = 1;
        if (!params.hasOwnProperty('buttonColorFocused')) params.buttonColorFocused = mod.CreateVector(1, 1, 1);
        if (!params.hasOwnProperty('buttonAlphaFocused')) params.buttonAlphaFocused = 1;
    }
    function __addUIButton(params: UIParams) {
        __fillInDefaultArgs(params);
        __fillInDefaultButtonArgs(params);
        const restrict = params.teamId ?? params.playerId;
        if (restrict !== undefined && restrict !== null) {
            mod.AddUIButton(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.buttonEnabled,
                __asModVector(params.buttonColorBase),
                params.buttonAlphaBase,
                __asModVector(params.buttonColorDisabled),
                params.buttonAlphaDisabled,
                __asModVector(params.buttonColorPressed),
                params.buttonAlphaPressed,
                __asModVector(params.buttonColorHover),
                params.buttonAlphaHover,
                __asModVector(params.buttonColorFocused),
                params.buttonAlphaFocused,
                restrict
            );
        } else {
            mod.AddUIButton(
                __cUniqueName,
                __asModVector(params.position),
                __asModVector(params.size),
                params.anchor,
                params.parent,
                params.visible,
                params.padding,
                __asModVector(params.bgColor),
                params.bgAlpha,
                params.bgFill,
                params.buttonEnabled,
                __asModVector(params.buttonColorBase),
                params.buttonAlphaBase,
                __asModVector(params.buttonColorDisabled),
                params.buttonAlphaDisabled,
                __asModVector(params.buttonColorPressed),
                params.buttonAlphaPressed,
                __asModVector(params.buttonColorHover),
                params.buttonAlphaHover,
                __asModVector(params.buttonColorFocused),
                params.buttonAlphaFocused
            );
        }
        return __setNameAndGetWidget(__cUniqueName, params);
    }
    function __addUIWidget(params: UIParams) {
        if (params == null) return undefined;
        if (params.type == 'Container') return __addUIContainer(params);
        else if (params.type == 'Text') return __addUIText(params);
        else if (params.type == 'Image') return __addUIImage(params);
        else if (params.type == 'Button') return __addUIButton(params);
        return undefined;
    }
    export function ParseUI(...params: any[]): mod.UIWidget | undefined {
        let widget: mod.UIWidget | undefined;
        for (let a = 0; a < params.length; a++) {
            widget = __addUIWidget(params[a] as UIParams);
        }
        return widget;
    }
}


// Module: modules/SafeSDKWrapper.ts
namespace ConquestV8 {
    export function isActivePlayer(player: mod.Player): boolean {
        if (!player) return false;
        try {
            if (!mod.IsPlayerValid(player)) return false;
        } catch (_e) {
            return false;
        }
        return safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
    }
    export function safeGetSoldierState<T>(
        player: mod.Player,
        stateKey: T,
        defaultValue: any = null
    ): any {
        if (!player) return defaultValue;
        if (!hasSoldier(player)) return defaultValue;
        try {
            const result = mod.GetSoldierState(player, stateKey as any);
            return result !== undefined ? result : defaultValue;
        } catch (_e) {
            return defaultValue;
        }
    }
    export function safeGetSoldierStateBool(
        player: mod.Player,
        stateKey: mod.SoldierStateBool
    ): boolean {
        return safeGetSoldierState(player, stateKey, false) === true;
    }
    export function safeGetSoldierStateVector(
        player: mod.Player,
        stateKey: mod.SoldierStateVector
    ): mod.Vector {
        const result = safeGetSoldierState(player, stateKey, null);
        return result ?? mod.CreateVector(0, 0, 0);
    }
    export function safeGetVehicleFromPlayer(player: mod.Player): mod.Vehicle | null {
        if (!player) return null;
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive)) {
            return null; // Dead/mandown players throw on GetVehicleFromPlayer
        }
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)) {
            return null;
        }
        try {
            const vehicle = mod.GetVehicleFromPlayer(player);
            return vehicle ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetPlayerFromVehicleSeat(
        vehicle: mod.Vehicle,
        seatNumber: number
    ): mod.Player | null {
        if (!vehicle) return null;
        try {
            if (!mod.IsVehicleSeatOccupied(vehicle, seatNumber)) {
                return null;
            }
            const player = mod.GetPlayerFromVehicleSeat(vehicle, seatNumber);
            return player ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetPlayerVehicleSeat(player: mod.Player): number {
        if (!player) return -1;
        try {
            const seat = mod.GetPlayerVehicleSeat(player);
            return typeof seat === "number" ? seat : -1;
        } catch (_e) {
            return -1;
        }
    }
    export function safeIsVehicleSeatOccupied(
        vehicle: mod.Vehicle,
        seatNumber: number
    ): boolean {
        if (!vehicle) return false;
        try {
            return mod.IsVehicleSeatOccupied(vehicle, seatNumber) === true;
        } catch (_e) {
            return false;
        }
    }
    export function safeForcePlayerToSeat(
        player: mod.Player,
        vehicle: mod.Vehicle,
        seatNumber: number
    ): boolean {
        if (!player || !vehicle) return false;
        if (!safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive)) {
            return false; // Can't seat dead player
        }
        try {
            mod.ForcePlayerToSeat(player, vehicle, seatNumber);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeForcePlayerExitVehicle(
        player: mod.Player,
        vehicle?: mod.Vehicle
    ): boolean {
        if (!player) return false;
        try {
            if (vehicle) mod.ForcePlayerExitVehicle(player, vehicle);
            else mod.ForcePlayerExitVehicle(player);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeSpawnAIFromAISpawner(
        spawner: mod.Spawner,
        nameMessage: mod.Message,
        team: mod.Team
    ): boolean {
        if (!spawner || !team) return false;
        try {
            mod.SpawnAIFromAISpawner(spawner, nameMessage, team);
            return true; // Assume success if no exception
        } catch (_e) {
            return false;
        }
    }
    export function safeCompareVehicleName(
        vehicle: mod.Vehicle,
        vehicleType: mod.VehicleList
    ): boolean {
        if (!vehicle) return false;
        try {
            return mod.CompareVehicleName(vehicle, vehicleType) === true;
        } catch (_e) {
            return false;
        }
    }
    export function safeDealDamageToVehicle(
        vehicle: mod.Vehicle,
        damageAmount: number
    ): boolean {
        if (!vehicle || damageAmount <= 0) return false;
        try {
            mod.DealDamage(vehicle, damageAmount);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeDealDamageToPlayer(
        player: mod.Player,
        damageAmount: number
    ): boolean {
        if (!player || damageAmount <= 0) return false;
        try {
            mod.DealDamage(player, damageAmount);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeHasSoldier(player: mod.Player): boolean {
        if (!player) return false;
        try {
            const isAlive = mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive);
            return isAlive !== undefined;
        } catch (_e) {
            return false;
        }
    }
    export function safeAIMoveTo(
        player: mod.Player,
        position: mod.Vector
    ): boolean {
        if (!player || !position) return false;
        try {
            mod.AIValidatedMoveToBehavior(player, position);
            return true;
        } catch (_e) {
            return false;
        }
    }
    export function safeGetVehicleSpawner(spawnerId: number): mod.VehicleSpawner | null {
        if (spawnerId < 0) return null;
        try {
            const spawner = mod.GetVehicleSpawner(spawnerId);
            return spawner ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetSpawner(spawnerId: number): mod.Spawner | null {
        if (spawnerId < 0) return null;
        try {
            const spawner = mod.GetSpawner(spawnerId);
            return spawner ?? null;
        } catch (_e) {
            return null;
        }
    }
    export function safeGetVehicleStateVector(
        vehicle: mod.Vehicle,
        stateKey: mod.VehicleStateVector
    ): mod.Vector | null {
        if (!vehicle) return null;
        try {
            return mod.GetVehicleState(vehicle, stateKey);
        } catch (_e) {
            return null;
        }
    }
}


// Module: modules/RegistryModule.ts
namespace ConquestV8 {
    export interface ObjectiveState {
        objId: number;
        index: number;
        teamId: number;          // 0=neutral, 1=team1, 2=team2
        letter: string;          // A, B, C, etc.
        captureProgress: number; // 0-100
        isContested: boolean;
    }
    let objectives: ObjectiveState[] = [];
    export function Registry_SetObjectives(newObjectives: ObjectiveState[]): void {
        objectives = newObjectives;
        log("[Registry] Registered " + objectives.length + " objectives");
    }
    export function Registry_GetObjectives(): ObjectiveState[] {
        return objectives;
    }
    export function Registry_GetObjective(index: number): ObjectiveState | null {
        return objectives[index] || null;
    }
    export function Registry_UpdateObjectiveOwnership(index: number, teamId: number): void {
        if (objectives[index]) {
            objectives[index].teamId = teamId;
        }
    }
    export function Registry_UpdateObjectiveContested(objId: number, isContested: boolean): void {
        const obj = objectives.find(o => o.objId === objId);
        if (obj) {
            obj.isContested = isContested;
        }
    }
    let ticketsTeam1 = STARTING_TICKETS;
    let ticketsTeam2 = STARTING_TICKETS;
    export function Registry_GetTickets(teamId: number): number {
        return teamId === 1 ? ticketsTeam1 : ticketsTeam2;
    }
    export function Registry_SetTickets(teamId: number, value: number): void {
        if (teamId === 1) {
            ticketsTeam1 = Math.max(0, value);
        } else {
            ticketsTeam2 = Math.max(0, value);
        }
    }
    export function Registry_DeductTickets(teamId: number, amount: number): void {
        const current = Registry_GetTickets(teamId);
        Registry_SetTickets(teamId, current - amount);
    }
    export interface Squad {
        id: number;
        teamId: number;
        members: mod.Player[];
        assignedObjectiveIndex: number;  // -1 = no assignment
    }
    let squads: Squad[] = [];
    export function Registry_SetSquads(newSquads: Squad[]): void {
        squads = newSquads;
    }
    export function Registry_GetSquads(teamId?: number): Squad[] {
        if (teamId !== undefined) {
            return squads.filter(s => s.teamId === teamId);
        }
        return squads;
    }
    export function Registry_GetSquad(squadId: number): Squad | null {
        return squads.find(s => s.id === squadId) || null;
    }
    export function Registry_UpdateSquadAssignment(squadId: number, objectiveIndex: number): void {
        const squad = Registry_GetSquad(squadId);
        if (squad) {
            squad.assignedObjectiveIndex = objectiveIndex;
        }
    }
    let aiCountTeam1 = 0;
    let aiCountTeam2 = 0;
    export function Registry_GetAICount(teamId: number): number {
        return teamId === 1 ? aiCountTeam1 : aiCountTeam2;
    }
    export function Registry_SetAICount(teamId: number, count: number): void {
        if (teamId === 1) {
            aiCountTeam1 = count;
        } else {
            aiCountTeam2 = count;
        }
    }
    export function Registry_IncrementAICount(teamId: number): void {
        if (teamId === 1) {
            aiCountTeam1++;
        } else {
            aiCountTeam2++;
        }
    }
    export function Registry_DecrementAICount(teamId: number): void {
        if (teamId === 1) {
            aiCountTeam1 = Math.max(0, aiCountTeam1 - 1);
        } else {
            aiCountTeam2 = Math.max(0, aiCountTeam2 - 1);
        }
    }
    export enum RoundState {
        PreRound,
        Intro,
        Active,
        Ending,
        Ended
    }
    let roundState = RoundState.PreRound;
    let roundStartTime = 0;
    let portalRoundNumber = 0;
    export function Registry_GetRoundState(): RoundState {
        return roundState;
    }
    export function Registry_SetRoundState(state: RoundState): void {
        roundState = state;
    }
    export function Registry_GetRoundStartTime(): number {
        return roundStartTime;
    }
    export function Registry_SetRoundStartTime(time: number): void {
        roundStartTime = time;
    }
    export function Registry_GetPortalRoundNumber(): number {
        return portalRoundNumber;
    }
    export function Registry_IncrementPortalRoundNumber(): number {
        portalRoundNumber++;
        log(`[Registry] Portal Round ${portalRoundNumber} starting`);
        return portalRoundNumber;
    }
    export function Registry_Reset(): void {
        objectives = [];
        ticketsTeam1 = STARTING_TICKETS;
        ticketsTeam2 = STARTING_TICKETS;
        squads = [];
        aiCountTeam1 = 0;
        aiCountTeam2 = 0;
        roundState = RoundState.PreRound;
        roundStartTime = 0;
        log("[Registry] All state reset");
    }
}


// Module: modules/SoundsModule.ts
namespace ConquestV8 {
    let initialized = false;
    let audioInitialized = false;
    let sfxCaptureStartedFriendly: mod.SFX | null = null;
    let sfxCaptureStartedEnemy: mod.SFX | null = null;
    let sfxCapturedFriendly: mod.SFX | null = null;
    let sfxNeutralize: mod.SFX | null = null;
    let sfxContested: mod.SFX | null = null;
    let sfxObjectiveEnter: mod.SFX | null = null;
    let sfxObjectiveExit: mod.SFX | null = null;
    let sfxTickFriendlyLoop: mod.SFX | null = null;
    let sfxTickEnemyLoop: mod.SFX | null = null;
    let sfxTickFriendlyShot: mod.SFX | null = null;
    let sfxTickEnemyShot: mod.SFX | null = null;
    let sfxVoModule: mod.SFX | null = null;
    let voModuleObjId = 0;
    let voErrorLogged = false;
    let team1Handle: mod.Team | null = null;
    let team2Handle: mod.Team | null = null;
    let musicLoaded = false;
    let startRoundMusicPlayed = false;
    let startRoundMusicRetryPending = false;
    let startRoundMusicRetryDeadline = 0;
    let sfxAmbientWindGust: mod.SFX | null = null;
    let sfxAmbientUav: mod.SFX | null = null;
    let sfxAmbientBirds: mod.SFX | null = null;
    const CAPTURE_SOUND_COOLDOWN = 3.0;
    const TICK_SOUND_INTERVAL = 1.0;  // OneShot tick beat fires every second
    const lastCaptureStatusByObj: number[] = [];
    const lastCaptureSoundTimeByObj: number[] = [];
    const lastTickSoundTimeByObj: number[] = [];
    const tickLoopActiveByObj: boolean[] = [];
    const neutralizePlayedByObj: boolean[] = [];
    const VO_FLAGS: mod.VoiceOverFlags[] = [];
    const PROGRESS_VO_COOLDOWN = 45.0; // Minimum seconds between progress VO lines
    let lastProgressVoTime = -9999;
    let progressStage = 0; // 0=early, 1=mid, 2=late (based on ticket ratio)
    let timeWarning120Played = false;
    let timeWarning60Played = false;
    let timeWarning30Played = false;
    let lastPhaseMusicPlayed = false;
    let overtimeMusicPlayed = false;
    let endRoundMusicPlayed = false;
    const MUSIC_PARAM_UPDATE_INTERVAL = 5.0; // Update music params every 5s
    let lastMusicParamUpdate = -9999;
    let lowCountTeam1Played = false;
    let lowCountTeam2Played = false;
    const LOW_TICKET_THRESHOLD_RATIO = 0.15; // 15% of starting tickets
    let firstSpawnVoPlayed = false;
    let overtimeVoPlayed = false;
    let timeLowVoPlayed = false;
    interface AmbientAnchor {
        name: string;
        category: "wind" | "uav" | "birds";
        position: mod.Vector;
        attenuationRange: number;
        amplitude: number;
        intervalSeconds: number;
        nextPlayTime: number;
    }
    const badlandsWinterAmbientAnchors: AmbientAnchor[] = [];
    export function initSoundsModule(): void {
        initialized = true;
        audioInitialized = false;
        voModuleObjId = 0;
        team1Handle = mod.GetTeam(1);
        team2Handle = mod.GetTeam(2);
        VO_FLAGS.length = 0;
        VO_FLAGS.push(mod.VoiceOverFlags.Alpha);
        VO_FLAGS.push(mod.VoiceOverFlags.Bravo);
        VO_FLAGS.push(mod.VoiceOverFlags.Charlie);
        VO_FLAGS.push(mod.VoiceOverFlags.Delta);
        VO_FLAGS.push(mod.VoiceOverFlags.Echo);
        VO_FLAGS.push(mod.VoiceOverFlags.Foxtrot);
        VO_FLAGS.push(mod.VoiceOverFlags.Golf);
        const n = OBJECTIVES.length;
        lastCaptureStatusByObj.length = n;
        lastCaptureSoundTimeByObj.length = n;
        lastTickSoundTimeByObj.length = n;
        tickLoopActiveByObj.length = n;
        neutralizePlayedByObj.length = n;
        for (let i = 0; i < n; i++) {
            lastCaptureStatusByObj[i] = 0;
            lastCaptureSoundTimeByObj[i] = -9999;
            lastTickSoundTimeByObj[i] = -9999;
            tickLoopActiveByObj[i] = false;
            neutralizePlayedByObj[i] = false;
        }
        lastProgressVoTime = -9999;
        progressStage = 0;
        timeWarning120Played = false;
        timeWarning60Played = false;
        timeWarning30Played = false;
        startRoundMusicPlayed = false;
        startRoundMusicRetryPending = false;
        startRoundMusicRetryDeadline = 0;
        lastPhaseMusicPlayed = false;
        overtimeMusicPlayed = false;
        endRoundMusicPlayed = false;
        lastMusicParamUpdate = -9999;
        lowCountTeam1Played = false;
        lowCountTeam2Played = false;
        firstSpawnVoPlayed = false;
        overtimeVoPlayed = false;
        timeLowVoPlayed = false;
        musicLoaded = false;
        resetBadlandsWinterAmbience();
        try {
            mod.LoadMusic(mod.MusicPackages.Core);
            musicLoaded = true;
        } catch (_e) {
            musicLoaded = false;
        }
        log("[ConquestV10][Sounds] Initialized");
    }
    function ensureInit(): void {
        if (!initialized) initSoundsModule();
    }
    function ensureMusicLoaded(): void {
        if (musicLoaded) return;
        try {
            mod.LoadMusic(mod.MusicPackages.Core);
            musicLoaded = true;
        } catch (_e) {
        }
    }
    function hasAnyDeployedPlayer(): boolean {
        try {
            const players = mod.AllPlayers();
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(players, i) as mod.Player;
                if (!player) continue;
                if (!mod.IsPlayerValid(player)) continue;
                if (!hasSoldier(player)) continue;
                return true;
            }
        } catch (_e) {
        }
        return false;
    }
    function playMatchStartMusic(): void {
        ensureMusicLoaded();
        mod.PlayMusic(mod.MusicEvents.Core_PhaseBegin);
        log("[Sounds] Match start music: Core_PhaseBegin");
    }
    function spawnSfx(spawnId: number): mod.SFX | null {
        if (!spawnId) return null;
        try {
            const zero = mod.CreateVector(0, 0, 0);
            return mod.SpawnObject(spawnId, zero, zero, zero) as mod.SFX;
        } catch (_e) {
            return null;
        }
    }
    function initAudioHandles(): void {
        if (audioInitialized) return;
        safeCall("Sounds:SpawnHandles", () => {
            sfxCaptureStartedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByFriendly_OneShot2D
            );
            sfxCaptureStartedEnemy = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureStartedByEnemy_OneShot2D
            );
            sfxCapturedFriendly = spawnSfx(
                mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnCapturedByFriendly_OneShot2D
            );
            sfxNeutralize = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CaptureNeutralize_OneShot2D);
            sfxContested = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_OnContested_OneShot2D);
            sfxObjectiveEnter = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnEnter_OneShot2D);
            sfxObjectiveExit = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_ObjectiveOnExit_OneShot2D);
            sfxTickFriendlyLoop = null;
            sfxTickEnemyLoop = null;
            sfxTickFriendlyShot = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickFriendly_OneShot2D);
            sfxTickEnemyShot = spawnSfx(mod.RuntimeSpawn_Common.SFX_UI_Gamemode_Shared_CaptureObjectives_CapturingTickEnemy_OneShot2D);
            sfxVoModule = spawnSfx(mod.RuntimeSpawn_Common.SFX_VOModule_OneShot2D);
            sfxAmbientWindGust = spawnSfx(mod.RuntimeSpawn_Common.SFX_GameModes_BR_Circle_Wind_OneShot3D);
            sfxAmbientUav = spawnSfx(mod.RuntimeSpawn_Common.SFX_Gadgets_Drone_Switchblade_Engine_Propellar_OneShot3D);
            sfxAmbientBirds = spawnSfx(mod.RuntimeSpawn_Common.SFX_Levels_Brooklyn_Shared_BigWorld_Birds_Falcons_OneShot3D);
        });
        if (sfxVoModule) {
            safeCall("Sounds:VoContext", () => {
                voModuleObjId = mod.GetObjId(sfxVoModule as unknown as mod.Object);
                log(`[ConquestV10][Sounds] VO module spawned objId=${voModuleObjId}`);
            });
        } else {
            voModuleObjId = 0;
            log("[ConquestV10][Sounds] VO module spawn FAILED (no VO)");
        }
        audioInitialized = true;
    }
    function refreshAudioHandles(): void {
        ensureInit();
        if (!audioInitialized) initAudioHandles();
    }
    function getTeamId(team: mod.Team | null): number {
        if (!team) return 0;
        try {
            const id = mod.GetObjId(team);
            return id === 1 || id === 2 ? id : 0;
        } catch (_e) {
            return 0;
        }
    }
    function getObjectiveIndexByObjId(objId: number): number {
        const objectives = Registry_GetObjectives();
        for (let i = 0; i < objectives.length; i++) {
            if (objectives[i].objId === objId) return i;
        }
        return -1;
    }
    function getVoFlagForLetter(letter: string): mod.VoiceOverFlags | undefined {
        switch (letter) {
            case "A": return mod.VoiceOverFlags.Alpha;
            case "B": return mod.VoiceOverFlags.Bravo;
            case "C": return mod.VoiceOverFlags.Charlie;
            case "D": return mod.VoiceOverFlags.Delta;
            case "E": return mod.VoiceOverFlags.Echo;
            case "F": return mod.VoiceOverFlags.Foxtrot;
            case "G": return mod.VoiceOverFlags.Golf;
            default: return undefined;
        }
    }
    function getVoFlagForObjId(objId: number): mod.VoiceOverFlags | undefined {
        const objective = getObjectiveByObjId(objId);
        if (objective) {
            console.log(`[Sounds] getVoFlagForObjId: objId=${objId} -> letter=${objective.id} -> ${objective.name}`);
            return getVoFlagForLetter(objective.id);
        }
        console.log(`[Sounds] getVoFlagForObjId: objId=${objId} not found`);
        return undefined;
    }
    function playSoundOnPlayer(sfx: mod.SFX | null, player: mod.Player | null, volume: number): void {
        if (!sfx || !player) return;
        try {
            mod.PlaySound(sfx, volume, player);
        } catch (_e) {
        }
    }
    function playSoundToTeam(sfx: mod.SFX | null, team: mod.Team | null, volume: number): void {
        if (!sfx || !team) return;
        try {
            mod.PlaySound(sfx, volume, team);
        } catch (_e) {
        }
    }
    function playSoundToAllPlayers(sfx: mod.SFX | null, volume: number): void {
        if (!sfx) return;
        try {
            mod.PlaySound(sfx, volume);
        } catch (_e) {
        }
    }
    function playVoToTeam(teamId: number, voEvent: mod.VoiceOverEvents2D, voFlag: mod.VoiceOverFlags): void {
        refreshAudioHandles();
        const team = teamId === 1 ? team1Handle : teamId === 2 ? team2Handle : null;
        if (!team) return;
        if (voModuleObjId <= 0) {
            if (!voErrorLogged) {
                log("[Sounds] PlayVO skipped - VO module not spawned (voModuleObjId=0)");
                voErrorLogged = true;
            }
            return;
        }
        try {
            const vo = mod.GetVO(voModuleObjId);
            mod.PlayVO(vo, voEvent, voFlag, team);
        } catch (_e) {
            if (!voErrorLogged) {
                log(`[Sounds] PlayVO failed: ${_e}`);
                voErrorLogged = true;
            }
        }
    }
    function playSpatialSound(sfx: mod.SFX | null, amplitude: number, position: mod.Vector, attenuationRange: number): void {
        if (!sfx) return;
        try {
            mod.PlaySound(sfx, amplitude, position, attenuationRange);
        } catch (_e) {
        }
    }
    function getAmbientHandle(category: "wind" | "uav" | "birds"): mod.SFX | null {
        if (category === "wind") return sfxAmbientWindGust;
        if (category === "uav") return sfxAmbientUav;
        return sfxAmbientBirds;
    }
    function resetBadlandsWinterAmbience(): void {
        badlandsWinterAmbientAnchors.length = 0;
        if (!mod.IsCurrentMap(mod.Maps.Badlands)) return;
        badlandsWinterAmbientAnchors.push(
            {
                name: "HQ1 Wind",
                category: "wind",
                position: mod.CreateVector(394.045, 77.788, 0.265),
                attenuationRange: 130,
                amplitude: 0.65,
                intervalSeconds: 24,
                nextPlayTime: 4,
            },
            {
                name: "HQ1 UAV",
                category: "uav",
                position: mod.CreateVector(394.045, 84.5, 0.265),
                attenuationRange: 170,
                amplitude: 0.42,
                intervalSeconds: 19,
                nextPlayTime: 8,
            },
            {
                name: "HQ2 Wind",
                category: "wind",
                position: mod.CreateVector(-234.16, 89.611, -475.176),
                attenuationRange: 130,
                amplitude: 0.65,
                intervalSeconds: 24,
                nextPlayTime: 6,
            },
            {
                name: "HQ2 UAV",
                category: "uav",
                position: mod.CreateVector(-234.16, 96.5, -475.176),
                attenuationRange: 170,
                amplitude: 0.42,
                intervalSeconds: 19,
                nextPlayTime: 10,
            },
            {
                name: "POI A Wind",
                category: "wind",
                position: mod.CreateVector(432.684, 113.738, -378.751),
                attenuationRange: 120,
                amplitude: 0.58,
                intervalSeconds: 27,
                nextPlayTime: 12,
            },
            {
                name: "POI A Birds",
                category: "birds",
                position: mod.CreateVector(432.684, 121.0, -378.751),
                attenuationRange: 140,
                amplitude: 0.34,
                intervalSeconds: 41,
                nextPlayTime: 18,
            },
            {
                name: "POI C Wind",
                category: "wind",
                position: mod.CreateVector(333.654, 100.205, -516.653),
                attenuationRange: 115,
                amplitude: 0.55,
                intervalSeconds: 30,
                nextPlayTime: 14,
            },
            {
                name: "POI E Wind",
                category: "wind",
                position: mod.CreateVector(449.654, 119.183, -581.453),
                attenuationRange: 125,
                amplitude: 0.6,
                intervalSeconds: 28,
                nextPlayTime: 16,
            },
            {
                name: "POI E Birds",
                category: "birds",
                position: mod.CreateVector(449.654, 126.0, -581.453),
                attenuationRange: 145,
                amplitude: 0.32,
                intervalSeconds: 44,
                nextPlayTime: 24,
            },
            {
                name: "POI F Wind",
                category: "wind",
                position: mod.CreateVector(263.954, 114.897, -668.353),
                attenuationRange: 130,
                amplitude: 0.62,
                intervalSeconds: 26,
                nextPlayTime: 20,
            },
            {
                name: "POI G Wind",
                category: "wind",
                position: mod.CreateVector(90.175, 126.026, -682.988),
                attenuationRange: 120,
                amplitude: 0.56,
                intervalSeconds: 31,
                nextPlayTime: 22,
            },
            {
                name: "POI G Birds",
                category: "birds",
                position: mod.CreateVector(90.175, 132.0, -682.988),
                attenuationRange: 145,
                amplitude: 0.3,
                intervalSeconds: 48,
                nextPlayTime: 30,
            }
        );
    }
    function playCaptureStartedSFX(capturingTeamId: number): void {
        refreshAudioHandles();
        const friendlyTeam = capturingTeamId === 1 ? team1Handle : team2Handle;
        const enemyTeam = capturingTeamId === 1 ? team2Handle : team1Handle;
        playSoundToTeam(sfxCaptureStartedFriendly, friendlyTeam, 1.0);
        playSoundToTeam(sfxCaptureStartedEnemy, enemyTeam, 1.0);
    }
    function startTickLoopForPlayer(player: mod.Player, capturingTeamId: number): void {
        const playerTeamId = getPlayerTeamId(player);
        const loopSfx = playerTeamId === capturingTeamId ? sfxTickFriendlyLoop : sfxTickEnemyLoop;
        if (!loopSfx) return;
        try { mod.PlaySound(loopSfx, 1.0, player); } catch (_e) {}
    }
    function stopTickLoopForPlayer(player: mod.Player): void {
        if (sfxTickFriendlyLoop) { try { mod.StopSound(sfxTickFriendlyLoop, player); } catch (_e) {} }
        if (sfxTickEnemyLoop) { try { mod.StopSound(sfxTickEnemyLoop, player); } catch (_e) {} }
    }
    function startTickLoopForAllOnPoint(cp: mod.CapturePoint, capturingTeamId: number): void {
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (p) startTickLoopForPlayer(p, capturingTeamId);
            }
        } catch (_e) {}
    }
    function stopTickLoopForAllOnPoint(cp: mod.CapturePoint): void {
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (p) stopTickLoopForPlayer(p);
            }
        } catch (_e) {}
    }
    function fireTickShotForAllOnPoint(cp: mod.CapturePoint, capturingTeamId: number): void {
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p) continue;
                if (!mod.IsPlayerValid(p)) continue;
                if (!hasSoldier(p)) continue;
                if (!isAlive(p)) continue;
                const playerTeamId = getPlayerTeamId(p);
                const shotSfx = playerTeamId === capturingTeamId ? sfxTickFriendlyShot : sfxTickEnemyShot;
                if (shotSfx) { try { mod.PlaySound(shotSfx, 1.0, p); } catch (_e2) {} }
            }
        } catch (_e) {}
    }
    function playCaptureCompleteSFX(newOwnerTeamId: number, previousOwnerTeamId: number): void {
        refreshAudioHandles();
        const newOwnerTeam = newOwnerTeamId === 1 ? team1Handle : newOwnerTeamId === 2 ? team2Handle : null;
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (newOwnerTeam) playSoundToTeam(sfxCapturedFriendly, newOwnerTeam, 1.0);
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);
    }
    function playContestedSFX(): void {
        refreshAudioHandles();
        playSoundToAllPlayers(sfxContested, 0.5);
    }
    function playCapturedSound(teamId: number, objId: number, previousOwnerTeamId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;
        console.log(`[Sounds] playCapturedSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, losingTeam=${otherTeam}`);
        playCaptureCompleteSFX(teamId, previousOwnerTeamId);
        if (voFlag === undefined) return;
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveCapturedEnemy, voFlag);
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCaptured, voFlag);
    }
    function playContestedSound(_objectiveIndex: number): void {
        playContestedSFX();
        const objectives = Registry_GetObjectives();
        if (_objectiveIndex >= 0 && _objectiveIndex < objectives.length) {
            const obj = objectives[_objectiveIndex];
            const voFlag = getVoFlagForLetter(obj.letter);
            if (voFlag !== undefined) {
                playVoToTeam(1, mod.VoiceOverEvents2D.ObjectiveContested, voFlag);
                playVoToTeam(2, mod.VoiceOverEvents2D.ObjectiveContested, voFlag);
            }
        }
    }
    function playCaptureStartSound(teamId: number, objId: number): void {
        const voFlag = getVoFlagForObjId(objId);
        const otherTeam = teamId === 1 ? 2 : 1;
        console.log(`[Sounds] playCaptureStartSound: objId=${objId}, voFlag=${voFlag}, capTeam=${teamId}, enemyTeam=${otherTeam}`);
        playCaptureStartedSFX(teamId);
        if (voFlag === undefined) return;
        playVoToTeam(teamId, mod.VoiceOverEvents2D.ObjectiveCapturing, voFlag);
        playVoToTeam(otherTeam, mod.VoiceOverEvents2D.ObjectiveTerritoryLost, voFlag);
    }
    function playNeutralizeSound(previousOwnerTeamId: number, objId: number): void {
        refreshAudioHandles();
        const voFlag = getVoFlagForObjId(objId);
        const losingTeam = previousOwnerTeamId === 1 ? team1Handle : previousOwnerTeamId === 2 ? team2Handle : null;
        if (losingTeam) playSoundToTeam(sfxNeutralize, losingTeam, 1.0);
        if (voFlag === undefined) return;
        if (previousOwnerTeamId === 1 || previousOwnerTeamId === 2) {
            playVoToTeam(previousOwnerTeamId, mod.VoiceOverEvents2D.ObjectiveNeutralised, voFlag);
        }
    }
    function isContestedByPlayers(cp: mod.CapturePoint): boolean {
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(playersOnPoint);
            let seen1 = false;
            let seen2 = false;
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) seen1 = true;
                if (tid === 2) seen2 = true;
                if (seen1 && seen2) return true;
            }
        } catch (_e) {
        }
        return false;
    }
    export function Sounds_notifyCaptureStatus(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - (lastCaptureSoundTimeByObj[objectiveIndex] ?? -9999) < CAPTURE_SOUND_COOLDOWN) return;
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        const contested = isContestedByPlayers(cp);
        const prevStatus = lastCaptureStatusByObj[objectiveIndex] ?? 0;
        if (contested) {
            if (prevStatus !== -1) {
                playContestedSound(objectiveIndex);
                lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
            }
            lastCaptureStatusByObj[objectiveIndex] = -1;
            return;
        }
        if ((capturingTeamId === 1 || capturingTeamId === 2) && capturingTeamId !== ownerTeamId) {
            if (capturingTeamId === prevStatus) return;
            lastCaptureStatusByObj[objectiveIndex] = capturingTeamId;
            neutralizePlayedByObj[objectiveIndex] = false;
            playCaptureStartSound(capturingTeamId, objId);
            lastCaptureSoundTimeByObj[objectiveIndex] = timeNow;
        }
    }
    export function Sounds_notifyCaptureTick(cp: mod.CapturePoint): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        const stopLoop = (): void => {
            if (tickLoopActiveByObj[objectiveIndex]) {
                stopTickLoopForAllOnPoint(cp);
                tickLoopActiveByObj[objectiveIndex] = false;
            }
        };
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) { stopLoop(); return; }
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        let progress = 0;
        try { progress = mod.GetCaptureProgress(cp); } catch (_e) { stopLoop(); return; }
        if (progress <= 0 || progress >= 1) { stopLoop(); return; }
        if ((ownerTeamId === 1 || ownerTeamId === 2) && capturingTeamId !== ownerTeamId) {
            const wasNeutralized = neutralizePlayedByObj[objectiveIndex] ?? false;
            if (!wasNeutralized && progress >= 0.5) {
                neutralizePlayedByObj[objectiveIndex] = true;
                playNeutralizeSound(ownerTeamId, objId);
            }
        }
        refreshAudioHandles();
        if (!tickLoopActiveByObj[objectiveIndex]) {
            startTickLoopForAllOnPoint(cp, capturingTeamId);
            tickLoopActiveByObj[objectiveIndex] = true;
        }
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - (lastTickSoundTimeByObj[objectiveIndex] ?? -9999) >= TICK_SOUND_INTERVAL) {
            lastTickSoundTimeByObj[objectiveIndex] = timeNow;
            fireTickShotForAllOnPoint(cp, capturingTeamId);
        }
    }
    export function Sounds_onCapturePointCaptured(cp: mod.CapturePoint, previousOwnerTeamId: number): void {
        ensureInit();
        if (!cp) return;
        const objId = mod.GetObjId(cp);
        const objectiveIndex = getObjectiveIndexByObjId(objId);
        if (objectiveIndex < 0) return;
        const ownerTeamId = getTeamId(mod.GetCurrentOwnerTeam(cp));
        if (ownerTeamId !== 1 && ownerTeamId !== 2) return;
        neutralizePlayedByObj[objectiveIndex] = false;
        lastCaptureStatusByObj[objectiveIndex] = 0;
        if (tickLoopActiveByObj[objectiveIndex]) {
            stopTickLoopForAllOnPoint(cp);
            tickLoopActiveByObj[objectiveIndex] = false;
        }
        playCapturedSound(ownerTeamId, objId, previousOwnerTeamId);
    }
    export function Sounds_onPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveEnter, player, 0.8);
        if (!cp || !player) return;
        const capturingTeamId = getTeamId(mod.GetOwnerProgressTeam(cp));
        if (capturingTeamId !== 1 && capturingTeamId !== 2) return;
        let progress = 0;
        try { progress = mod.GetCaptureProgress(cp); } catch (_e) { return; }
        if (progress <= 0 || progress >= 1) return;
        startTickLoopForPlayer(player, capturingTeamId);
    }
    export function Sounds_onPlayerExitCapturePoint(player: mod.Player): void {
        ensureInit();
        refreshAudioHandles();
        playSoundOnPlayer(sfxObjectiveExit, player, 0.8);
        stopTickLoopForPlayer(player);
    }
    export function Sounds_onPlayerDied(player: mod.Player): void {
        stopTickLoopForPlayer(player);
    }
    export function Sounds_playMatchStart(): void {
        ensureInit();
        refreshAudioHandles();
        if (!startRoundMusicPlayed) {
            startRoundMusicPlayed = true;
            try {
                playMatchStartMusic();
                startRoundMusicRetryPending = !hasAnyDeployedPlayer();
                startRoundMusicRetryDeadline = mod.GetMatchTimeElapsed() + 12.0;
            } catch (e) {
                log("[Sounds] Match start music failed: " + e);
            }
        }
        playVoToTeam(1, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
        playVoToTeam(2, mod.VoiceOverEvents2D.RoundStartGeneric, mod.VoiceOverFlags.Alpha);
    }
    export function Sounds_tickEarlyRoundMusic(currentTime: number): void {
        if (!startRoundMusicRetryPending) return;
        if (currentTime > startRoundMusicRetryDeadline) {
            startRoundMusicRetryPending = false;
            return;
        }
        if (!hasAnyDeployedPlayer()) return;
        try {
            playMatchStartMusic();
        } catch (e) {
            log("[Sounds] Match start retry failed: " + e);
        }
        startRoundMusicRetryPending = false;
    }
    export function Sounds_tickMapAmbience(currentTime: number): void {
        ensureInit();
        if (!mod.IsCurrentMap(mod.Maps.Badlands)) return;
        if (badlandsWinterAmbientAnchors.length === 0) return;
        refreshAudioHandles();
        for (const anchor of badlandsWinterAmbientAnchors) {
            if (currentTime < anchor.nextPlayTime) continue;
            const sfx = getAmbientHandle(anchor.category);
            if (sfx) {
                playSpatialSound(sfx, anchor.amplitude, anchor.position, anchor.attenuationRange);
            }
            anchor.nextPlayTime = currentTime + anchor.intervalSeconds;
        }
    }
    export function Sounds_tickMatchProgress(): void {
        ensureInit();
        refreshAudioHandles();
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - lastProgressVoTime < PROGRESS_VO_COOLDOWN) return;
        const t1 = Registry_GetTickets(1);
        const t2 = Registry_GetTickets(2);
        if (t1 <= 0 || t2 <= 0) return; // Match ending, skip progress VO
        const maxTickets = STARTING_TICKETS;
        const avgRatio = ((t1 + t2) / 2) / maxTickets;
        let stage: number;
        if (avgRatio > 0.65) stage = 0;      // Early (>65% tickets remain)
        else if (avgRatio > 0.30) stage = 1;  // Mid (30-65%)
        else stage = 2;                        // Late (<30%)
        if (stage <= progressStage) return;
        progressStage = stage;
        lastProgressVoTime = timeNow;
        const ticketDiff = t1 - t2;
        const threshold = maxTickets * 0.10; // 10% ticket difference = significant lead
        if (stage === 1) {
            if (ticketDiff > threshold) {
                playVoToTeam(1, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha);
                playVoToTeam(2, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha);
            } else if (ticketDiff < -threshold) {
                playVoToTeam(2, mod.VoiceOverEvents2D.ProgressMidWinning, mod.VoiceOverFlags.Alpha);
                playVoToTeam(1, mod.VoiceOverEvents2D.ProgressMidLosing, mod.VoiceOverFlags.Alpha);
            }
        } else if (stage === 2) {
            if (ticketDiff > threshold) {
                playVoToTeam(1, mod.VoiceOverEvents2D.ProgressLateWinning, mod.VoiceOverFlags.Alpha);
                playVoToTeam(2, mod.VoiceOverEvents2D.ProgressLateLosing, mod.VoiceOverFlags.Alpha);
            } else if (ticketDiff < -threshold) {
                playVoToTeam(2, mod.VoiceOverEvents2D.ProgressLateWinning, mod.VoiceOverFlags.Alpha);
                playVoToTeam(1, mod.VoiceOverEvents2D.ProgressLateLosing, mod.VoiceOverFlags.Alpha);
            }
        }
    }
    export function Sounds_tickTimeWarnings(timeRemainingSeconds: number): void {
        ensureInit();
        refreshAudioHandles();
        if (!timeWarning120Played && timeRemainingSeconds <= 120 && timeRemainingSeconds > 55) {
            timeWarning120Played = true;
            playVoToTeam(1, mod.VoiceOverEvents2D.Time120Left, mod.VoiceOverFlags.Alpha);
            playVoToTeam(2, mod.VoiceOverEvents2D.Time120Left, mod.VoiceOverFlags.Alpha);
        }
        if (!timeWarning60Played && timeRemainingSeconds <= 60 && timeRemainingSeconds > 25) {
            timeWarning60Played = true;
            playVoToTeam(1, mod.VoiceOverEvents2D.Time60Left, mod.VoiceOverFlags.Alpha);
            playVoToTeam(2, mod.VoiceOverEvents2D.Time60Left, mod.VoiceOverFlags.Alpha);
        }
        if (!timeWarning30Played && timeRemainingSeconds <= 30) {
            timeWarning30Played = true;
            playVoToTeam(1, mod.VoiceOverEvents2D.Time30Left, mod.VoiceOverFlags.Alpha);
            playVoToTeam(2, mod.VoiceOverEvents2D.Time30Left, mod.VoiceOverFlags.Alpha);
        }
        if (!lastPhaseMusicPlayed && !overtimeMusicPlayed && timeRemainingSeconds <= 60) {
            lastPhaseMusicPlayed = true;
            try {
                ensureMusicLoaded();
                mod.PlayMusic(mod.MusicEvents.Core_LastPhaseBegin);
                log("[Sounds] Near-end music: Core_LastPhaseBegin");
            } catch (e) {
                log("[Sounds] Near-end music failed: " + e);
            }
        }
    }
    export function Sounds_triggerOvertimeMusic(): void {
        if (overtimeMusicPlayed) return;
        overtimeMusicPlayed = true;
        try {
            ensureMusicLoaded();
            mod.PlayMusic(mod.MusicEvents.Core_Overtime_Loop);
            log("[Sounds] Low-ticket overtime music triggered");
        } catch (e) {
            log("[Sounds] Low-ticket music failed: " + e);
        }
    }
    export function Sounds_tickDynamicMusic(): void {
        ensureInit();
        if (!musicLoaded) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow - lastMusicParamUpdate < MUSIC_PARAM_UPDATE_INTERVAL) return;
        lastMusicParamUpdate = timeNow;
        const t1 = Registry_GetTickets(1);
        const t2 = Registry_GetTickets(2);
        if (t1 <= 0 || t2 <= 0) return;
        const maxTickets = STARTING_TICKETS;
        const diff = t1 - t2;
        const threshold = maxTickets * 0.05; // 5% = close game
        let isWinning1 = 0.5;
        let isWinning2 = 0.5;
        if (diff > threshold) {
            isWinning1 = 1;
            isWinning2 = 0;
        } else if (diff < -threshold) {
            isWinning1 = 0;
            isWinning2 = 1;
        }
        const avgRatio = ((t1 + t2) / 2) / maxTickets;
        const urgency = Math.min(1, Math.max(0, 1 - avgRatio));
        try {
            if (team1Handle) {
                mod.SetMusicParam(mod.MusicParams.Core_IsWinning, isWinning1, team1Handle);
                mod.SetMusicParam(mod.MusicParams.Core_Urgency, urgency, team1Handle);
            }
            if (team2Handle) {
                mod.SetMusicParam(mod.MusicParams.Core_IsWinning, isWinning2, team2Handle);
                mod.SetMusicParam(mod.MusicParams.Core_Urgency, urgency, team2Handle);
            }
        } catch (_e) {
        }
    }
    export function Sounds_tickLowTicketVO(): void {
        ensureInit();
        refreshAudioHandles();
        const t1 = Registry_GetTickets(1);
        const t2 = Registry_GetTickets(2);
        const threshold = Math.floor(STARTING_TICKETS * LOW_TICKET_THRESHOLD_RATIO);
        if (!lowCountTeam1Played && t1 > 0 && t1 <= threshold) {
            lowCountTeam1Played = true;
            playVoToTeam(2, mod.VoiceOverEvents2D.PlayerCountEnemyLow, mod.VoiceOverFlags.Alpha);
            playVoToTeam(1, mod.VoiceOverEvents2D.PlayerCountFriendlyLow, mod.VoiceOverFlags.Alpha);
            log(`[Sounds] Low-ticket VO: Team 1 at ${t1} tickets`);
        }
        if (!lowCountTeam2Played && t2 > 0 && t2 <= threshold) {
            lowCountTeam2Played = true;
            playVoToTeam(1, mod.VoiceOverEvents2D.PlayerCountEnemyLow, mod.VoiceOverFlags.Alpha);
            playVoToTeam(2, mod.VoiceOverEvents2D.PlayerCountFriendlyLow, mod.VoiceOverFlags.Alpha);
            log(`[Sounds] Low-ticket VO: Team 2 at ${t2} tickets`);
        }
    }
    export function Sounds_playFirstSpawnVO(): void {
        if (firstSpawnVoPlayed) return;
        firstSpawnVoPlayed = true;
        ensureInit();
        refreshAudioHandles();
        playVoToTeam(1, mod.VoiceOverEvents2D.FirstSpawn, mod.VoiceOverFlags.Alpha);
        playVoToTeam(2, mod.VoiceOverEvents2D.FirstSpawn, mod.VoiceOverFlags.Alpha);
        log("[Sounds] First-spawn VO played");
    }
    export function Sounds_tickTimeCriticalVO(timeRemainingSeconds: number): void {
        ensureInit();
        refreshAudioHandles();
        if (!timeLowVoPlayed && timeRemainingSeconds <= 15 && timeRemainingSeconds > 0) {
            timeLowVoPlayed = true;
            playVoToTeam(1, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha);
            playVoToTeam(2, mod.VoiceOverEvents2D.TimeLow, mod.VoiceOverFlags.Alpha);
            log("[Sounds] TimeLow VO");
        }
    }
    export function Sounds_playOvertimeVO(): void {
        if (overtimeVoPlayed) return;
        overtimeVoPlayed = true;
        ensureInit();
        refreshAudioHandles();
        playVoToTeam(1, mod.VoiceOverEvents2D.TimeOvertime, mod.VoiceOverFlags.Alpha);
        playVoToTeam(2, mod.VoiceOverEvents2D.TimeOvertime, mod.VoiceOverFlags.Alpha);
        log("[Sounds] Overtime VO played");
    }
    export function Sounds_playMatchEnd(winningTeamId: number, winReason?: string): void {
        ensureInit();
        refreshAudioHandles();
        const winningTeam = winningTeamId === 1 ? team1Handle : winningTeamId === 2 ? team2Handle : null;
        const losingTeamId = winningTeamId === 1 ? 2 : 1;
        const losingTeam = losingTeamId === 1 ? team1Handle : losingTeamId === 2 ? team2Handle : null;
        try {
            ensureMusicLoaded();
            if (winningTeam) mod.PlayMusic(mod.MusicEvents.Core_Stinger_Positive, winningTeam);
            if (losingTeam) mod.PlayMusic(mod.MusicEvents.Core_Stinger_Negative, losingTeam);
        } catch (e) {
            log("[Sounds] End-of-round stingers failed: " + e);
        }
        if (!endRoundMusicPlayed) {
            endRoundMusicPlayed = true;
            try {
                ensureMusicLoaded();
                mod.PlayMusic(mod.MusicEvents.Core_EndOfRound_Loop);
            } catch (e) {
                log("[Sounds] End-of-round music failed: " + e);
            }
        }
        playVoToTeam(winningTeamId, mod.VoiceOverEvents2D.GlobalEOMVictory, mod.VoiceOverFlags.Alpha);
        playVoToTeam(losingTeamId, mod.VoiceOverEvents2D.GlobalEOMDefeat, mod.VoiceOverFlags.Alpha);
        if (winReason === "kills") {
            playVoToTeam(winningTeamId, mod.VoiceOverEvents2D.RoundEndFriendlyKills, mod.VoiceOverFlags.Alpha);
            playVoToTeam(losingTeamId, mod.VoiceOverEvents2D.RoundEndEnemyKills, mod.VoiceOverFlags.Alpha);
        } else {
            playVoToTeam(winningTeamId, mod.VoiceOverEvents2D.RoundEndFriendlyCapture, mod.VoiceOverFlags.Alpha);
            playVoToTeam(losingTeamId, mod.VoiceOverEvents2D.RoundEndEnemyCapture, mod.VoiceOverFlags.Alpha);
        }
        log(`[Sounds] End-of-round: team ${winningTeamId} wins (reason: ${winReason ?? "default"})`);
    }
}


// Module: modules/ObjectiveModule.ts
namespace ConquestV8 {
    const LETTER_MAP = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    let initialized = false;
    function getLetterFromCapturePoint(cp: mod.CapturePoint, fallbackIndex: number): string {
        const objId = mod.GetObjId(cp);
        const objective = OBJECTIVES.find(obj => obj.objId === objId);
        if (objective) {
            log("[Objective] Matched objId " + objId + " to letter '" + objective.id + "' from config");
            return objective.id;
        }
        const letter = LETTER_MAP[fallbackIndex] || ("CP" + fallbackIndex);
        log("[Objective] No config match for objId " + objId + ", using fallback '" + letter + "'");
        return letter;
    }
    export function Objective_Init(): void {
        if (initialized) return;
        const objectives: ObjectiveState[] = [];
        const allCapturePoints = mod.AllCapturePoints();
        const count = mod.CountOf(allCapturePoints);
        for (let i = 0; i < count; i++) {
            const cp = mod.ValueInArray(allCapturePoints, i) as mod.CapturePoint;
            const objId = mod.GetObjId(cp);
            const letter = getLetterFromCapturePoint(cp, i);
            objectives.push({
                objId,
                index: i,
                teamId: 0,  // Start neutral
                letter,
                captureProgress: 0,
                isContested: false
            });
            log("[Objective] Discovered " + letter + " (objId=" + objId + ", index=" + i + ")");
        }
        Registry_SetObjectives(objectives);
        initialized = true;
        log("[Objective] Initialized with " + count + " objectives");
    }
    export function Objective_OnCaptured(cp: mod.CapturePoint, newTeamId: number): void {
        const objId = mod.GetObjId(cp);
        const objectives = Registry_GetObjectives();
        const obj = objectives.find(o => o.objId === objId);
        if (obj) {
            const oldTeamId = obj.teamId;
            if (oldTeamId === newTeamId) return;
            Registry_UpdateObjectiveOwnership(obj.index, newTeamId);
            log("[Objective] " + obj.letter + " captured: team " + oldTeamId + " -> " + newTeamId);
            try {
                Sounds_onCapturePointCaptured(cp, oldTeamId);
            } catch (e) {
            }
        }
    }
    export function Objective_Tick(): void {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return;
        for (const obj of objectives) {
            try {
                const cp = mod.GetCapturePoint(obj.objId);
                if (!cp) continue;
                const owner = mod.GetCurrentOwnerTeam(cp);
                const ownerId = owner ? mod.GetObjId(owner) : 0;
                const normalizedOwner = ownerId === 1 || ownerId === 2 ? ownerId : 0;
                if (obj.teamId !== normalizedOwner) {
                    Registry_UpdateObjectiveOwnership(obj.index, normalizedOwner);
                }
            } catch (_e) {
            }
        }
    }
    export function Objective_GetOwnedCount(teamId: number): number {
        const objectives = Registry_GetObjectives();
        return objectives.filter(o => o.teamId === teamId).length;
    }
    export function Objective_GetNeutralCount(): number {
        const objectives = Registry_GetObjectives();
        return objectives.filter(o => o.teamId === 0).length;
    }
    export function Objective_Reset(): void {
        initialized = false;
        log("[Objective] Reset");
    }
}


// Module: modules/CapturePointModule.ts
namespace ConquestV8 {
    let initialized = false;
    export function CapturePoint_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[CapturePoint] Initialized");
    }
    export function CapturePoint_OnCaptured(cp: mod.CapturePoint): void {
        const ownerTeam = mod.GetCurrentOwnerTeam(cp);
        const capturingTeamId = mod.GetObjId(ownerTeam);
        const objId = mod.GetObjId(cp);
        const losingTeamId = capturingTeamId === 1 ? 2 : (capturingTeamId === 2 ? 1 : 0);
        Objective_OnCaptured(cp, capturingTeamId);
        try {
            const playersOnPoint = mod.GetPlayersOnPoint(cp);
            if (playersOnPoint) {
                const count = mod.CountOf(playersOnPoint);
                for (let i = 0; i < count; i++) {
                    const p = mod.ValueInArray(playersOnPoint, i) as mod.Player;
                    if (!p) continue;
                    try {
                        const pTeam = mod.GetTeam(p);
                        if (pTeam && mod.GetObjId(pTeam) === capturingTeamId) {
                            Scoreboard_recordCapture(p);
                        }
                    } catch (_e) {
                    }
                }
            }
        } catch (e) {
            logDebug(`[CapturePoint] Failed to award capture credit for obj ${objId}: ${e}`);
        }
    }
    export function CapturePoint_DisableAll(): void {
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            try {
                const cp = mod.GetCapturePoint(obj.objId);
                if (cp) {
                    mod.EnableGameModeObjective(cp, false);
                }
            } catch (e) {
                logError("[CapturePoint] Failed to disable " + obj.letter + ": " + e);
            }
        }
        log("[CapturePoint] All objectives DISABLED (intro)");
    }
    export function CapturePoint_EnableAll(): void {
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            try {
                const cp = mod.GetCapturePoint(obj.objId);
                if (cp) {
                    mod.EnableGameModeObjective(cp, true);
                    mod.EnableCapturePointDeploying(cp, true);
                    mod.SetCapturePointCapturingTime(cp, CAPTURE_TIME_SECONDS);
                    mod.SetCapturePointNeutralizationTime(cp, NEUTRALIZE_TIME_SECONDS);
                    mod.SetMaxCaptureMultiplier(cp, CAPTURE_MAX_MULTIPLIER);
                }
            } catch (e) {
                logError("[CapturePoint] Failed to enable " + obj.letter + ": " + e);
            }
        }
        log("[CapturePoint] All objectives enabled");
    }
    export function CapturePoint_Reset(): void {
        initialized = false;
        log("[CapturePoint] Reset");
    }
}


// Module: modules/Addbotnames.ts
namespace ConquestV8 {
    const BOT_NAME_POOL: string[] = [
        "Apex [bot]","Vector [bot]","Cipher [bot]","Echo [bot]","Delta [bot]","Bravo [bot]","Alpha [bot]","Omega [bot]",
        "Sentinel [bot]","Phantom [bot]","Havoc [bot]","Aurora [bot]","Nyx [bot]","Viper [bot]","Blaze [bot]","Specter [bot]",
        "Hydra [bot]","Falcon [bot]","Raptor [bot]","Nova [bot]","Atlas [bot]","Sable [bot]","Zephyr [bot]","Onyx [bot]",
        "Mirage [bot]","Javelin [bot]","Horizon [bot]","Tempest [bot]","Gladius [bot]","Striker [bot]","Thunder [bot]","Vanguard [bot]",
        "Trident [bot]","Peregrine [bot]","Ironclad [bot]","Rogue [bot]","Nomad [bot]","Quasar [bot]","Saber [bot]","Foxtrot [bot]",
        "Sierra [bot]","Talon [bot]","Valkyrie [bot]","Titan [bot]","Pioneer [bot]","Artemis [bot]","Helios [bot]","Hades [bot]",
        "Apollo [bot]","Erebus [bot]","Loki [bot]","Odin [bot]","Freya [bot]","Heimdall [bot]","Thor [bot]","Skadi [bot]",
        "Fenrir [bot]","Warden [bot]","Maverick [bot]","Ranger [bot]","Paladin [bot]","Reaper [bot]","Ghost [bot]","Raven [bot]",
        "Wolf [bot]","Bear [bot]","Lion [bot]","Tiger [bot]","Eagle [bot]","Hawk [bot]","Kestrel [bot]","Condor [bot]",
        "Orion [bot]","Pegasus [bot]","Draco [bot]","Lyra [bot]","Vega [bot]","Sirius [bot]","Polaris [bot]","Altair [bot]",
        "Comet [bot]","Meteor [bot]","Astro [bot]","Nebula [bot]","Cosmos [bot]","Quantum [bot]","Ion [bot]","Neon [bot]",
        "Pulse [bot]","Surge [bot]","Fury [bot]","Rift [bot]","Shade [bot]","Grit [bot]","Forge [bot]","Ember [bot]",
        "Stone [bot]","Steel [bot]","Copper [bot]","Cobalt [bot]","Silver [bot]","Gold [bot]","Obsidian [bot]","Granite [bot]",
        "Cinder [bot]","Frost [bot]","Blizzard [bot]","Monsoon [bot]","Cyclone [bot]","Quake [bot]","Aftershock [bot]","Tremor [bot]",
        "Tundra [bot]","Savanna [bot]","Canyon [bot]","Harbor [bot]","Outpost [bot]","Bastion [bot]","Citadel [bot]","Frontier [bot]",
        "Rook [bot]","Bishop [bot]","Knight [bot]","Ace [bot]","Drifter [bot]","Gambit [bot]","Charger [bot]","Rocket [bot]",
        "Riptide [bot]","Seabird [bot]","Voyager [bot]","Navigator [bot]","Trail [bot]","Pathfinder [bot]","Overwatch [bot]","Wildfire [bot]",
    ];
    let cursor = 0;
    export function initBotNames(): void {
        for (let i = BOT_NAME_POOL.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = BOT_NAME_POOL[i];
            BOT_NAME_POOL[i] = BOT_NAME_POOL[j];
            BOT_NAME_POOL[j] = tmp;
        }
        cursor = 0;
    }
    export function nextBotName(): string {
        if (BOT_NAME_POOL.length === 0) {
            return "Bot";
        }
        const name = BOT_NAME_POOL[cursor % BOT_NAME_POOL.length];
        cursor++;
        return `${name}`;
    }
}


// Module: modules/ObjectiveBiasModule.ts
namespace ConquestV8 {
    const BIAS_TICK_INTERVAL_SECONDS = 5.0;
    const DEFAULT_WEIGHT = 50;
    const MIN_WEIGHT = 10;
    const MAX_WEIGHT = 100;
    const OVERCROWDED_THRESHOLD = 6;   // More than 6 AI at one objective = overcrowded (lowered from 8)
    const UNDERDEFENDED_THRESHOLD = 2; // Fewer than 2 AI at owned objective = underdefended
    const WEIGHT_DECREASE_OVERCROWDED = 8;   // Increased from 3 to 8
    const WEIGHT_INCREASE_UNDERDEFENDED = 5; // Increased from 3 to 5
    const WEIGHT_BOOST_NEWLY_CAPTURED = 5;
    const WEIGHT_PENALTY_RECENTLY_LOST = 5;
    const WEIGHT_DECAY_RATE = 1; // Gradual return to default
    let initialized = false;
    let lastBiasTickTime = -9999;
    const objectiveWeights: Map<number, number> = new Map();
    const aiCountByObjective: Map<number, number> = new Map();
    const recentCaptures: Map<number, number> = new Map(); // objId -> captureTime
    const recentLosses: Map<number, number> = new Map();   // objId -> lossTime
    const CAPTURE_BOOST_DURATION_SECONDS = 30.0;
    export function ObjectiveBias_Init(): void {
        if (initialized) return;
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            objectiveWeights.set(obj.objId, DEFAULT_WEIGHT);
            aiCountByObjective.set(obj.objId, 0);
        }
        initialized = true;
        log("[ObjectiveBias] Initialized with " + objectives.length + " objectives at weight " + DEFAULT_WEIGHT);
    }
    export function ObjectiveBias_Tick(currentTime: number): void {
        if (!initialized) return;
        if (currentTime - lastBiasTickTime < BIAS_TICK_INTERVAL_SECONDS) return;
        lastBiasTickTime = currentTime;
        updateAICountsPerObjective();
        evaluateAndAdjustWeights(currentTime);
        if (DEBUG_LOGS) {
            logBiasSummary();
        }
    }
    function updateAICountsPerObjective(): void {
        for (const objId of aiCountByObjective.keys()) {
            aiCountByObjective.set(objId, 0);
        }
        const objectives = Registry_GetObjectives();
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                const isAI = ConquestV8.safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAISoldier);
                if (!isAI) continue;
                const isAlive = ConquestV8.safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
                if (!isAlive) continue;
                const playerPos = ConquestV8.safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
                const nearestObj = findNearestObjective(playerPos, objectives);
                if (nearestObj) {
                    const currentCount = aiCountByObjective.get(nearestObj.objId) ?? 0;
                    aiCountByObjective.set(nearestObj.objId, currentCount + 1);
                }
            }
        } catch (e) {
            logError("[ObjectiveBias] Failed to count AI: " + e);
        }
    }
    function findNearestObjective(playerPos: mod.Vector, objectives: ObjectiveState[]): ObjectiveState | null {
        const px = mod.XComponentOf(playerPos);
        const py = mod.YComponentOf(playerPos);
        const pz = mod.ZComponentOf(playerPos);
        let nearest: ObjectiveState | null = null;
        let nearestDistSq = OBJECTIVE_RADIUS_METERS * OBJECTIVE_RADIUS_METERS * 4; // 2x radius for detection
        for (const obj of objectives) {
            const configObj = getObjectiveByObjId(obj.objId);
            if (!configObj) continue;
            const dx = px - configObj.x;
            const dy = py - configObj.y;
            const dz = pz - configObj.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearest = obj;
            }
        }
        return nearest;
    }
    function evaluateAndAdjustWeights(currentTime: number): void {
        const objectives = Registry_GetObjectives();
        for (const obj of objectives) {
            let weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            if (aiCount > OVERCROWDED_THRESHOLD) {
                weight -= WEIGHT_DECREASE_OVERCROWDED;
                logDebugKey(`Bias:Overcrowded:${obj.objId}`, 
                    `[ObjectiveBias] ${obj.letter} overcrowded (${aiCount} AI), weight -${WEIGHT_DECREASE_OVERCROWDED}`, 10.0);
            }
            if (obj.teamId !== 0 && aiCount < UNDERDEFENDED_THRESHOLD) {
                weight += WEIGHT_INCREASE_UNDERDEFENDED;
                logDebugKey(`Bias:Underdefended:${obj.objId}`,
                    `[ObjectiveBias] ${obj.letter} underdefended (${aiCount} AI), weight +${WEIGHT_INCREASE_UNDERDEFENDED}`, 10.0);
            }
            if (obj.teamId === 0) {
                weight += 1;
            }
            const captureTime = recentCaptures.get(obj.objId);
            if (captureTime && currentTime - captureTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight += WEIGHT_BOOST_NEWLY_CAPTURED;
            } else if (captureTime) {
                recentCaptures.delete(obj.objId);
            }
            const lossTime = recentLosses.get(obj.objId);
            if (lossTime && currentTime - lossTime < CAPTURE_BOOST_DURATION_SECONDS) {
                weight -= WEIGHT_PENALTY_RECENTLY_LOST;
            } else if (lossTime) {
                recentLosses.delete(obj.objId);
            }
            if (weight > DEFAULT_WEIGHT) {
                weight -= WEIGHT_DECAY_RATE;
            } else if (weight < DEFAULT_WEIGHT) {
                weight += WEIGHT_DECAY_RATE;
            }
            weight = Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight));
            objectiveWeights.set(obj.objId, weight);
        }
    }
    export function ObjectiveBias_GetSuggestedObjective(teamId: number): ObjectiveState | null {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return null;
        const candidates: Array<{ obj: ObjectiveState; weight: number; aiCount: number }> = [];
        for (const obj of objectives) {
            const weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            if (aiCount > OVERCROWDED_THRESHOLD) continue;
            let priorityBonus = 0;
            if (obj.teamId === 0) {
                priorityBonus = 30; // Neutral - high priority
            } else if (obj.teamId !== teamId) {
                priorityBonus = 20; // Enemy-held - medium priority
            } else {
                priorityBonus = 0;  // Owned - lowest priority (unless underdefended)
                if (aiCount < UNDERDEFENDED_THRESHOLD) {
                    priorityBonus = 15; // Underdefended owned flag needs help
                }
            }
            candidates.push({
                obj,
                weight: weight + priorityBonus,
                aiCount
            });
        }
        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.weight - a.weight);
        return candidates[0].obj;
    }
    export function ObjectiveBias_GetWeight(objId: number): number {
        return objectiveWeights.get(objId) ?? DEFAULT_WEIGHT;
    }
    export function ObjectiveBias_GetAICount(objId: number): number {
        return aiCountByObjective.get(objId) ?? 0;
    }
    function logBiasSummary(): void {
        const objectives = Registry_GetObjectives();
        const parts: string[] = [];
        for (const obj of objectives) {
            const weight = objectiveWeights.get(obj.objId) ?? DEFAULT_WEIGHT;
            const aiCount = aiCountByObjective.get(obj.objId) ?? 0;
            const owner = obj.teamId === 0 ? "N" : (obj.teamId === 1 ? "T1" : "T2");
            parts.push(`${obj.letter}:${weight}(${aiCount}AI,${owner})`);
        }
        logDebugKey("ObjectiveBias:Summary", `[ObjectiveBias] Weights: ${parts.join(" ")}`, 15.0);
    }
    export function ObjectiveBias_Reset(): void {
        initialized = false;
        lastBiasTickTime = -9999;
        objectiveWeights.clear();
        aiCountByObjective.clear();
        recentCaptures.clear();
        recentLosses.clear();
        log("[ObjectiveBias] Reset");
    }
}


// Module: modules/SpawnRecycleModule.ts
namespace ConquestV8 {
    const RECYCLE_ENABLED = true;   // ENABLED - we trigger respawn on dead bots
    const MAX_BOTS_PER_TEAM = 20;            // Max SCRIPTED bots per team (20 gives Portal headroom for static AI)
    const TEAM_POPULATION_CAP = 32;          // Max TOTAL players per team (humans + scripted + backfill)
    const SPAWN_BATCH_SIZE = 4;              // Spawn 4 bots at a time
    const SPAWN_BATCH_INTERVAL = 2.0;        // Wait 2 seconds between batches
    const RECYCLE_DELAY_SECONDS = 1.0;       // Wait 1s after death before recycling (was 3s)
    const RECYCLE_BATCH_SIZE = 2;            // Recycle 2 dead bots per tick
    const PENDING_RECYCLE_TIMEOUT = 5.0;     // If pendingRecycle for 5s, retry DeployPlayer
    const SPAWN_PROTECTION_SECONDS = 3.0;    // Don't validate/recycle bots within 3s of spawn
    const ANTI_CLUSTER_COOLDOWN = 30.0;      // Don't spawn at same objective within 30s
    const OBJECTIVE_PRESSURE_WEIGHT = 2.0;   // Weight for objectives under enemy pressure
    const OBJECTIVE_CAPTURE_WEIGHT = 3.0;    // Weight for objectives being captured
    const OBJECTIVE_DEFENSE_WEIGHT = 1.5;    // Weight for owned objectives needing defense
    const RANDOMIZATION_FACTOR = 0.3;        // 30% randomization to prevent predictability
    const BEHAVIOR_MODE = 1;
    let currentMapType: 'capstone' | 'downtown' | 'metro' | 'unknown' = 'unknown';
    function detectMapBehaviorMode(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                currentMapType = 'capstone';
                log(`[SpawnRecycle] Map: Capstone`);
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                currentMapType = 'downtown';
                log(`[SpawnRecycle] Map: Downtown`);
            } else {
                currentMapType = 'unknown';
                log(`[SpawnRecycle] Map: Unknown`);
            }
        } catch (e) {
            currentMapType = 'unknown';
            log(`[SpawnRecycle] Map detection failed: ${e}`);
        }
        log(`[SpawnRecycle] Using Mode 1 (AIBattlefieldBehavior)`);
    }
    function safeApplyBehavior(player: mod.Player, behaviorFn: () => void, behaviorName: string): boolean {
        try {
            const botId = mod.GetObjId(player);
            if (!mod.IsPlayerValid(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} invalid player`);
                return false;
            }
            if (!hasSoldier(player)) {
                log(`[SpawnRecycle] Safe behavior skip: Bot ${botId} not deployed`);
                return false;
            }
            behaviorFn();
            return true;
        } catch (e) {
            log(`[SpawnRecycle] Safe behavior error (${behaviorName}): ${e}`);
            return false;
        }
    }
    function enableBotGadgets(player: mod.Player): void {
        try {
            mod.AIGadgetSettings(player, false, false, false);
        } catch (e) {
        }
    }
    function getPlayerHealthState(player: mod.Player): { current: number | null; max: number | null } {
        let current: number | null = null;
        let max: number | null = null;
        try {
            current = mod.GetSoldierState(player, mod.SoldierStateNumber.CurrentHealth);
        } catch (_e) {
            current = null;
        }
        try {
            max = mod.GetSoldierState(player, mod.SoldierStateNumber.MaxHealth);
        } catch (_e) {
            max = null;
        }
        return { current, max };
    }
    function clampPlayerHealthRequest(value: number): number {
        return Math.max(1, Math.min(500, value));
    }
    function getBotHealthRequestValue(currentMax: number | null): number | null {
        if (currentMax !== null && currentMax === AI_BOT_MAX_HEALTH) {
            return null;
        }
        if (currentMax !== null && currentMax > AI_BOT_MAX_HEALTH) {
            return clampPlayerHealthRequest(Math.round((AI_BOT_MAX_HEALTH * AI_BOT_MAX_HEALTH) / currentMax));
        }
        return clampPlayerHealthRequest(AI_BOT_MAX_HEALTH);
    }
    function applyAndLogBotHealth(player: mod.Player, botId: number, teamId: number, category: string): void {
        const before = getPlayerHealthState(player);
        const requestedMax = getBotHealthRequestValue(before.max);
        if (requestedMax !== null) {
            try {
                mod.SetPlayerMaxHealth(player, requestedMax);
            } catch (e) {
                log(
                    `[AIHealth] ${category} bot ${botId} team=${teamId} failed effectiveTarget=${AI_BOT_MAX_HEALTH} request=${requestedMax}: ${e}`
                );
                return;
            }
        }
        const after = getPlayerHealthState(player);
        const beforeCurrent = before.current === null ? "?" : `${before.current}`;
        const beforeMax = before.max === null ? "?" : `${before.max}`;
        const afterCurrent = after.current === null ? "?" : `${after.current}`;
        const afterMax = after.max === null ? "?" : `${after.max}`;
        const requestText = requestedMax === null ? "skip" : `${requestedMax}`;
        log(
            `[AIHealth] ${category} bot ${botId} team=${teamId} targetEffective=${AI_BOT_MAX_HEALTH} request=${requestText} before=${beforeCurrent}/${beforeMax} after=${afterCurrent}/${afterMax}`
        );
    }
    interface ReplacementSpawnEntry {
        teamId: number;
        deathTime: number;
        originalBotId: number;  // For logging only
    }
    const replacementSpawnQueue: ReplacementSpawnEntry[] = [];
    export interface BotEntry {
        botId: number;                       // mod.GetObjId(player)
        player: mod.Player;                  // Reference to bot
        teamId: number;                      // 1 or 2
        assignedObjectiveIndex: number;      // Which objective they're biased toward
        spawnTime: number;                   // When they spawned
        lastDeathTime: number;               // When they died (0 = alive)
        isAlive: boolean;                    // Current state
        spawnCount: number;                  // How many times recycled
        pendingRecycle: boolean;             // DeployPlayer called, waiting for OnPlayerDeployed
        pendingRecycleTime: number;          // When DeployPlayer was called (for timeout)
        redeployTimeCalled: boolean;         // Has SetRedeployTime been called for current death?
        spawnerId: number;                   // Which spawner created this bot
        mandownTime: number;                 // When bot entered ManDown state (0 = not in ManDown)
        waypointActive: boolean;             // True if bot is following a waypoint path toward objective
        waypointStartTime: number;           // When waypoint behavior was applied (for timeout)
        invalidSince: number;                // When IsPlayerValid first returned false (0 = valid)
    }
    const botRegistry: Map<number, BotEntry> = new Map();
    const waypointPathCache: Map<number, mod.WaypointPath> = new Map();
    let lastWaypointCheckTime = 0;
    function cacheWaypointPaths(): void {
        if (!ENABLE_WAYPOINT_ROUTING) return;
        for (let i = 0; i < OBJECTIVES.length; i++) {
            const obj = OBJECTIVES[i];
            if (obj.waypointPathId) {
                try {
                    const wp = mod.GetWaypointPath(obj.waypointPathId);
                    if (wp) {
                        waypointPathCache.set(i, wp);
                        log(`[SpawnRecycle] Cached waypoint path ${obj.waypointPathId} for objective ${obj.id}`);
                    }
                } catch (e) {
                    log(`[SpawnRecycle] Failed to get waypoint path ${obj.waypointPathId}: ${e}`);
                }
            }
        }
        log(`[SpawnRecycle] Waypoint routing: ${waypointPathCache.size}/${OBJECTIVES.length} paths cached`);
    }
    function applyWaypointRouting(player: mod.Player, botId: number, objectiveIndex: number): boolean {
        if (!ENABLE_WAYPOINT_ROUTING) return false;
        const wp = waypointPathCache.get(objectiveIndex);
        if (!wp) return false;
        try {
            mod.AIWaypointIdleBehavior(player, wp);
            log(`[SpawnRecycle] Bot ${botId} -> waypoint route to objective ${OBJECTIVES[objectiveIndex]?.id || objectiveIndex}`);
            return true;
        } catch (e) {
            log(`[SpawnRecycle] Waypoint behavior failed for bot ${botId}: ${e}`);
            return false;
        }
    }
    function tickWaypointArrivals(): void {
        if (!ENABLE_WAYPOINT_ROUTING) return;
        const now = mod.GetMatchTimeElapsed();
        if (now - lastWaypointCheckTime < WAYPOINT_CHECK_INTERVAL) return;
        lastWaypointCheckTime = now;
        for (const [botId, entry] of botRegistry) {
            if (!entry.isAlive || !entry.waypointActive) continue;
            try {
                if (!mod.IsPlayerValid(entry.player)) continue;
                if (!hasSoldier(entry.player)) continue;
                const botPos = mod.GetSoldierState(entry.player, mod.SoldierStateVector.GetPosition);
                if (!botPos) continue;
                const objIdx = entry.assignedObjectiveIndex;
                const obj = OBJECTIVES[objIdx];
                if (!obj) continue;
                const objPos = mod.CreateVector(obj.x, obj.y, obj.z);
                const dist = mod.DistanceBetween(botPos, objPos);
                const timedOut = (now - entry.waypointStartTime) > WAYPOINT_TIMEOUT;
                if (dist <= WAYPOINT_ARRIVAL_RADIUS || timedOut) {
                    mod.AIBattlefieldBehavior(entry.player);
                    entry.waypointActive = false;
                    if (timedOut) {
                        log(`[SpawnRecycle] Bot ${botId} waypoint timeout (${Math.round(now - entry.waypointStartTime)}s) -> AIBattlefieldBehavior`);
                    } else {
                        log(`[SpawnRecycle] Bot ${botId} arrived at ${obj.id} (${Math.round(dist)}m) -> AIBattlefieldBehavior`);
                    }
                }
            } catch (e) {
                entry.waypointActive = false;
            }
        }
    }
    const objectiveLastSpawnTime: Map<number, number> = new Map();
    let initialSpawnRemaining: Map<number, number> = new Map();
    let lastInitialSpawnTime = 0;
    let initialSpawnPhase = false;
    let spawnPointRotationIndex = 0;
    let initialized = false;
    let lastSpawnTime = 0;
    let lastTickTime = 0;
    let spawnerRotationIndex = 0;
    let classRotationIndex = 0;
    function getPlayerTeamId(player: mod.Player): number {
        try {
            const team = mod.GetTeam(player);
            return team ? mod.GetObjId(team) : 0;
        } catch (e) {
            return 0;
        }
    }
    function registerBot(player: mod.Player, teamId: number, objectiveIndex: number, spawnerId: number = 0): void {
        const botId = mod.GetObjId(player);
        const entry: BotEntry = {
            botId,
            player,
            teamId,
            assignedObjectiveIndex: objectiveIndex,
            spawnTime: mod.GetMatchTimeElapsed(),
            lastDeathTime: 0,
            isAlive: true,
            spawnCount: 1,
            pendingRecycle: false,
            pendingRecycleTime: 0,
            redeployTimeCalled: false,
            spawnerId: spawnerId,
            mandownTime: 0,
            waypointActive: false,
            waypointStartTime: 0,
            invalidSince: 0,
        };
        botRegistry.set(botId, entry);
        logDebug(`[SpawnRecycle] Registered bot ${botId} for team ${teamId} -> objective ${objectiveIndex} (spawner ${spawnerId})`);
    }
    function markBotDead(botId: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.isAlive = false;
            entry.lastDeathTime = mod.GetMatchTimeElapsed();
            log(`[SpawnRecycle] Bot ${botId} marked dead`);
        }
    }
    function updateBotAfterRecycle(botId: number, newPlayer: mod.Player, newObjectiveIndex: number): void {
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.player = newPlayer;
            entry.assignedObjectiveIndex = newObjectiveIndex;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.isAlive = true;
            entry.spawnCount++;
            log(`[SpawnRecycle] Bot ${botId} recycled -> objective ${newObjectiveIndex} (spawn #${entry.spawnCount})`);
        }
    }
    function getAliveBotsForTeam(teamId: number): BotEntry[] {
        const alive: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive) {
                alive.push(entry);
            }
        }
        return alive;
    }
    function getDeadBotsForTeam(teamId: number): BotEntry[] {
        const dead: BotEntry[] = [];
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && !entry.isAlive) {
                dead.push(entry);
            }
        }
        return dead;
    }
    function getTotalBotsForTeam(teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId) count++;
        }
        return count;
    }
    function getTotalTeamPopulation(teamId: number): number {
        let count = 0;
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return 0;
            const total = mod.CountOf(allPlayers);
            for (let i = 0; i < total; i++) {
                try {
                    const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                    if (!p) continue;
                    if (getPlayerTeamId(p) !== teamId) continue;
                    count++;
                } catch (_e) {}
            }
        } catch (_e) {}
        return count;
    }
    function canSpawnScriptedBot(teamId: number): boolean {
        const scriptedCount = getTotalBotsForTeam(teamId);
        if (scriptedCount >= MAX_BOTS_PER_TEAM) return false;
        const totalPop = getTotalTeamPopulation(teamId);
        if (totalPop >= TEAM_POPULATION_CAP) return false;
        return true;
    }
    function calculateObjectiveWeight(objectiveIndex: number, teamId: number): number {
        const objectives = Registry_GetObjectives();
        const obj = objectives[objectiveIndex];
        if (!obj) return 0;
        const currentTime = mod.GetMatchTimeElapsed();
        const enemyTeamId = teamId === 1 ? 2 : 1;
        let weight = 1.0; // Base weight
        if (obj.teamId === 0) {
            weight += OBJECTIVE_CAPTURE_WEIGHT;
        } else if (obj.teamId === teamId) {
            weight += OBJECTIVE_DEFENSE_WEIGHT;
        } else {
            weight += OBJECTIVE_PRESSURE_WEIGHT;
        }
        if (obj.isContested) {
            weight += 2.0;
        }
        const botsAtObjective = countBotsAssignedToObjective(objectiveIndex, teamId);
        const avgBotsPerObjective = getAliveBotsForTeam(teamId).length / objectives.length;
        if (botsAtObjective > avgBotsPerObjective * 1.5) {
            weight *= 0.3;
        } else if (botsAtObjective < avgBotsPerObjective * 0.5) {
            weight *= 1.5;
        }
        const lastSpawn = objectiveLastSpawnTime.get(objectiveIndex) || 0;
        const timeSinceLastSpawn = currentTime - lastSpawn;
        if (timeSinceLastSpawn < ANTI_CLUSTER_COOLDOWN) {
            const cooldownFactor = timeSinceLastSpawn / ANTI_CLUSTER_COOLDOWN;
            weight *= cooldownFactor;
        }
        const randomOffset = (Math.random() - 0.5) * 2 * RANDOMIZATION_FACTOR;
        weight *= (1 + randomOffset);
        return Math.max(0.1, weight); // Minimum weight to ensure all objectives are possible
    }
    function countBotsAssignedToObjective(objectiveIndex: number, teamId: number): number {
        let count = 0;
        for (const entry of botRegistry.values()) {
            if (entry.teamId === teamId && entry.isAlive && entry.assignedObjectiveIndex === objectiveIndex) {
                count++;
            }
        }
        return count;
    }
    function pickObjectiveForSpawn(teamId: number): number {
        const objectives = Registry_GetObjectives();
        if (objectives.length === 0) return 0;
        const ownedObjectives: number[] = [];
        const contestedObjectives: number[] = [];
        const neutralObjectives: number[] = [];
        const enemyObjectives: number[] = [];
        for (let i = 0; i < objectives.length; i++) {
            const obj = objectives[i];
            if (obj.teamId === teamId) {
                if (obj.isContested) {
                    contestedObjectives.push(i);
                } else {
                    ownedObjectives.push(i);
                }
            } else if (obj.teamId === 0) {
                neutralObjectives.push(i);
            } else {
                enemyObjectives.push(i);
            }
        }
        const weights: number[] = [];
        let totalWeight = 0;
        for (let i = 0; i < objectives.length; i++) {
            const weight = calculateObjectiveWeight(i, teamId);
            weights.push(weight);
            totalWeight += weight;
        }
        if (totalWeight <= 0) {
            log(`[SpawnRecycle] No objective weights - falling back to objective 0`);
            return 0;
        }
        let random = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        return 0;
    }
    function getSpawnPointIdForTeam(teamId: number): number {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnPointId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        return spawnPointId;
    }
    function getSpawnerForTeam(teamId: number): mod.Spawner | null {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnerId = spawnerIds[spawnerRotationIndex % spawnerIds.length];
        spawnerRotationIndex++;
        try {
            return mod.GetSpawner(spawnerId);
        } catch (e) {
            log(`[SpawnRecycle] Failed to get spawner ${spawnerId}: ${e}`);
            return null;
        }
    }
    function spawnBotForTeam(teamId: number, objectiveIndex: number): void {
        if (!canSpawnScriptedBot(teamId)) {
            log(`[SpawnRecycle] Quota guard: skipping spawn for team ${teamId} (scripted=${getTotalBotsForTeam(teamId)}/${MAX_BOTS_PER_TEAM}, teamPop=${getTotalTeamPopulation(teamId)}/${TEAM_POPULATION_CAP})`);
            return;
        }
        const spawner = getSpawnerForTeam(teamId);
        if (!spawner) {
            log(`[SpawnRecycle] No HQ spawner available for team ${teamId} - cannot spawn`);
            return;
        }
        try {
            const classes = [
                mod.SoldierClass.Assault,
                mod.SoldierClass.Engineer,
                mod.SoldierClass.Support,
                mod.SoldierClass.Recon,
            ];
            const soldierClass = classes[classRotationIndex % classes.length];
            classRotationIndex++;
            const team = mod.GetTeam(teamId);
            if (!team) {
                log(`[SpawnRecycle] Team ${teamId} not found`);
                return;
            }
            const name = nextBotName();
            const nameMsg = mod.Message(name);
            mod.SpawnAIFromAISpawner(spawner, soldierClass, nameMsg, team);
            objectiveLastSpawnTime.set(objectiveIndex, mod.GetMatchTimeElapsed());
            log(`[SpawnRecycle] Spawned bot for team ${teamId} at HQ, assigned to objective ${objectiveIndex}`);
        } catch (e) {
            const errorStr = String(e);
            if (errorStr.includes("OutOfAISpawnQuota")) {
                log(`[SpawnRecycle] AI quota reached - will retry later`);
            } else {
                log(`[SpawnRecycle] Spawn error: ${e}`);
            }
        }
    }
    export function SpawnRecycle_OnBotDied(player: mod.Player): void {
        if (!initialized) return;
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        if (!isAI) {
            return;
        }
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        if (ENABLE_REPLACEMENT_SPAWN) {
            replacementSpawnQueue.push({
                teamId: teamId,
                deathTime: currentTime,
                originalBotId: botId
            });
            log(`[SpawnRecycle] Bot ${botId} died (team ${teamId}) - queued REPLACEMENT spawn`);
            const entry = botRegistry.get(botId);
            if (entry) {
                entry.isAlive = false;
                entry.lastDeathTime = currentTime;
                entry.mandownTime = 0;  // Clear ManDown flag so validateRegistry doesn't skip recycling
            }
            return;
        }
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.isAlive = false;
            entry.pendingRecycle = false;  // Clear pending flag if set
            entry.lastDeathTime = currentTime;
            if (RECYCLE_ENABLED) {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - queued for DeployPlayer recycle`);
            } else {
                log(`[SpawnRecycle] Bot ${botId} died (team ${entry.teamId}) - spawner will handle respawn`);
            }
        } else {
            if (teamId > 0) {
                const newEntry: BotEntry = {
                    botId,
                    player,
                    teamId,
                    assignedObjectiveIndex: 0,
                    spawnTime: 0,
                    lastDeathTime: currentTime,
                    isAlive: false,
                    spawnCount: 0,
                    pendingRecycle: false,
                    pendingRecycleTime: 0,
                    redeployTimeCalled: false,
                    spawnerId: 0,
                    mandownTime: 0,
                    waypointActive: false,
                    waypointStartTime: 0,
                    invalidSince: 0,
                };
                botRegistry.set(botId, newEntry);
                log(`[SpawnRecycle] Untracked bot ${botId} died (team ${teamId}) - registered and queued`);
            }
        }
    }
    export function SpawnRecycle_OnBotMandown(player: mod.Player): void {
        if (!initialized) return;
        let isAI = false;
        try {
            isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
        } catch (e) {
            return;
        }
        if (!isAI) {
            return;
        }
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        const entry = botRegistry.get(botId);
        if (entry) {
            entry.mandownTime = currentTime;
            log(`[SpawnRecycle] Bot ${botId} entered ManDown at ${currentTime.toFixed(1)}s`);
            if (entry.spawnerId > 0) {
                try {
                    const spawner = mod.GetSpawner(entry.spawnerId);
                    mod.AISetUnspawnOnDead(spawner, false);
                    mod.SetUnspawnDelayInSeconds(spawner, 30); // safety net: even if AISetUnspawnOnDead is overridden, entity won't vanish for 30s
                    log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false + 30s delay on spawner ${entry.spawnerId}`);
                } catch (e) {
                    log(`[SpawnRecycle] Bot ${botId} ManDown - spawner ${entry.spawnerId} error: ${e}`);
                }
            } else {
                const spawnerIds = entry.teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
                for (const spawnerId of spawnerIds) {
                    try {
                        const spawner = mod.GetSpawner(spawnerId);
                        mod.AISetUnspawnOnDead(spawner, false);
                        mod.SetUnspawnDelayInSeconds(spawner, 30);
                    } catch (e) {
                    }
                }
                log(`[SpawnRecycle] Bot ${botId} ManDown - re-applied AISetUnspawnOnDead=false + 30s delay to team ${entry.teamId} spawners`);
            }
        } else {
            log(`[SpawnRecycle] Untracked bot ${botId} entered ManDown`);
        }
    }
    function getObjectPos(obj: mod.Object): mod.Vector | null {
        try {
            return mod.GetObjectPosition(obj);
        } catch (_e) {
            return null;
        }
    }
    function getSpawnPositionForTeam(teamId: number): mod.Vector {
        const spawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        const spawnerId = spawnerIds[spawnPointRotationIndex % spawnerIds.length];
        spawnPointRotationIndex++;
        try {
            const spawner = mod.GetSpawner(spawnerId);
            if (spawner) {
                const pos = getObjectPos(spawner as unknown as mod.Object);
                if (pos) return pos;
            }
        } catch (e) {}
        if (teamId === 1) {
            return mod.CreateVector(-1200, 150, 400); // Team 1 HQ approximate
        } else {
            return mod.CreateVector(-850, 150, -150); // Team 2 HQ approximate
        }
    }
    function applyBehaviorToBot(player: mod.Player, botId: number, objectiveIndex: number, currentTime: number): void {
        try {
            enableBotGadgets(player);
            const entry = botRegistry.get(botId);
            if (entry && applyWaypointRouting(player, botId, objectiveIndex)) {
                entry.waypointActive = true;
                entry.waypointStartTime = mod.GetMatchTimeElapsed();
            } else {
                safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
                if (entry) entry.waypointActive = false;
                log(`[SpawnRecycle] Bot ${botId} - AIBattlefieldBehavior applied`);
            }
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - applyBehaviorToBot error: ${e}`);
        }
    }
    function startInitialSpawn(): void {
        log(`[SpawnRecycle] Starting batched initial spawn (${MAX_BOTS_PER_TEAM} per team, ${SPAWN_BATCH_SIZE} at a time)...`);
        initialSpawnPhase = true;
        lastInitialSpawnTime = 0; // Force immediate first batch
        for (let teamId = 1; teamId <= 2; teamId++) {
            const currentCount = getTotalBotsForTeam(teamId);
            const needed = MAX_BOTS_PER_TEAM - currentCount;
            initialSpawnRemaining.set(teamId, needed);
            log(`[SpawnRecycle] Team ${teamId} needs ${needed} bots`);
        }
    }
    function processInitialSpawnBatch(currentTime: number): void {
        if (!initialSpawnPhase) return;
        if (currentTime - lastInitialSpawnTime < SPAWN_BATCH_INTERVAL) return;
        let spawnedThisBatch = 0;
        let totalRemaining = 0;
        for (let teamId = 1; teamId <= 2; teamId++) {
            const remaining = initialSpawnRemaining.get(teamId) || 0;
            totalRemaining += remaining;
            if (remaining <= 0) continue;
            const toSpawn = Math.min(remaining, SPAWN_BATCH_SIZE);
            for (let i = 0; i < toSpawn; i++) {
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                spawnBotForTeam(teamId, objectiveIndex);
                spawnedThisBatch++;
            }
            initialSpawnRemaining.set(teamId, remaining - toSpawn);
            log(`[SpawnRecycle] Spawned ${toSpawn} bots for team ${teamId}, ${remaining - toSpawn} remaining`);
        }
        lastInitialSpawnTime = currentTime;
        if (totalRemaining - spawnedThisBatch <= 0) {
            initialSpawnPhase = false;
            const t1Count = getTotalBotsForTeam(1);
            const t2Count = getTotalBotsForTeam(2);
            log(`[SpawnRecycle] Initial spawn COMPLETE: Team1=${t1Count}, Team2=${t2Count}`);
        }
    }
    export function SpawnRecycle_OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
        if (!initialized) return;
        if (!hasSoldier(player)) return;
        const isAI = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAISoldier);
        if (!isAI) return; // Ignore human spawns
        const botId = mod.GetObjId(player);
        const teamId = getPlayerTeamId(player);
        const objectiveIndex = pickObjectiveForSpawn(teamId);
        const spawnerId = mod.GetObjId(spawner);
        let posStr = "unknown";
        try {
            const spawnerObj = spawner as unknown as mod.Object;
            const pos = mod.GetObjectPosition(spawnerObj);
            const x = Math.round(mod.XComponentOf(pos));
            const y = Math.round(mod.YComponentOf(pos));
            const z = Math.round(mod.ZComponentOf(pos));
            posStr = `(${x},${y},${z})`;
        } catch (_e) {
            posStr = "(spawner_pos_error)";
        }
        let isRespawn = false;
        let entry: BotEntry | undefined;
        if (botRegistry.has(botId)) {
            isRespawn = true;
            entry = botRegistry.get(botId)!;
            entry.isAlive = true;
            entry.spawnTime = mod.GetMatchTimeElapsed();
            entry.lastDeathTime = 0;
            entry.spawnCount++;
            entry.assignedObjectiveIndex = objectiveIndex;
            entry.pendingRecycle = false;  // Clear pending state
            entry.redeployTimeCalled = false;  // Reset for next death cycle
            entry.spawnerId = spawnerId;  // Track spawner for ManDown re-application
            entry.mandownTime = 0;  // Clear mandown state
            entry.waypointActive = false;  // Reset waypoint state for new routing
            try {
                mod.AISetUnspawnOnDead(spawner, false);
                mod.SetUnspawnDelayInSeconds(spawner, 30); // belt-and-suspenders: prevents early removal during ManDown
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - re-applied AISetUnspawnOnDead=false + 30s delay`);
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} RESPAWN - spawner config failed: ${e}`);
            }
            log(`[SpawnRecycle] Bot ${botId} spawned again (spawn #${entry.spawnCount}) at ${posStr} from spawner ${spawnerId}`);
        } else {
            registerBot(player, teamId, objectiveIndex, spawnerId);
            entry = botRegistry.get(botId);
            logDebug(`[SpawnRecycle] New bot ${botId} registered at ${posStr} from spawner ${spawnerId}`);
            try {
                mod.AISetUnspawnOnDead(spawner, false);
                mod.SetUnspawnDelayInSeconds(spawner, 30); // belt-and-suspenders: prevents early removal during ManDown
                logDebug(`[SpawnRecycle] Bot ${botId} FIRST SPAWN - AISetUnspawnOnDead=false + 30s delay on spawner ${spawnerId}`);
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} FIRST SPAWN - spawner config failed: ${e}`);
            }
        }
        const spawnType = isRespawn ? "RESPAWN" : "FIRST SPAWN";
        enableBotGadgets(player);
        try {
            if (entry && applyWaypointRouting(player, botId, objectiveIndex)) {
                entry.waypointActive = true;
                entry.waypointStartTime = mod.GetMatchTimeElapsed();
                log(`[SpawnRecycle] Bot ${botId} - ${spawnType}: waypoint route to ${OBJECTIVES[objectiveIndex]?.id || objectiveIndex}`);
            } else {
                safeApplyBehavior(player, () => mod.AIBattlefieldBehavior(player), "AIBattlefieldBehavior");
                if (entry) entry.waypointActive = false;
                log(`[SpawnRecycle] Bot ${botId} - ${spawnType}: AIBattlefieldBehavior applied`);
            }
        } catch (e) {
            log(`[SpawnRecycle] Bot ${botId} - Behavior error: ${e}`);
        }
    }
    function getObjectivePosition(objectiveIndex: number): mod.Vector | null {
        try {
            const objectives = Registry_GetObjectives();
            if (objectiveIndex >= 0 && objectiveIndex < objectives.length) {
                const obj = objectives[objectiveIndex];
                if (obj && obj.objId) {
                    const capturePoint = mod.GetCapturePoint(obj.objId);
                    if (capturePoint) {
                        return mod.GetObjectPosition(capturePoint as unknown as mod.Object);
                    }
                }
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to get objective ${objectiveIndex} position: ${e}`);
        }
        return null;
    }
    function processReplacementSpawns(currentTime: number): void {
        if (!ENABLE_REPLACEMENT_SPAWN) return;
        if (replacementSpawnQueue.length === 0) return;
        let spawned = 0;
        let forwardSpawned = 0;
        const toRemove: number[] = [];
        for (let i = 0; i < replacementSpawnQueue.length && spawned < MAX_REPLACEMENT_SPAWNS_PER_TICK; i++) {
            const entry = replacementSpawnQueue[i];
            const timeSinceDeath = currentTime - entry.deathTime;
            if (timeSinceDeath < REPLACEMENT_SPAWN_DELAY) continue;
            const existingEntry = botRegistry.get(entry.originalBotId);
            if (existingEntry && existingEntry.isAlive) {
                log(`[SpawnRecycle] SKIP replacement for bot ${entry.originalBotId} (T${entry.teamId}) - already respawned natively`);
                toRemove.push(i);
                continue;
            }
            let forwardObjIndex = -1;
            if (FORWARD_SPAWN_ENABLED && forwardSpawned < FORWARD_SPAWN_MAX_PER_TICK && Math.random() < FORWARD_SPAWN_CHANCE) {
                forwardObjIndex = pickForwardSpawnObjective(entry.teamId);
                if (forwardObjIndex < 0) {
                    logDebug(`[SpawnRecycle] Forward pick T${entry.teamId}: no undefended flags being recaptured`);
                }
            }
            try {
                if (forwardObjIndex >= 0) {
                    spawnBotAtObjective(entry.teamId, forwardObjIndex);
                    forwardSpawned++;
                    const objLetter = OBJECTIVES[forwardObjIndex]?.id || String(forwardObjIndex);
                    log(`[SpawnRecycle] FORWARD SPAWN for T${entry.teamId} -> defend ${objLetter} (replacing bot ${entry.originalBotId})`);
                } else {
                    if (botRegistry.has(entry.originalBotId)) {
                        botRegistry.delete(entry.originalBotId);
                        log(`[SpawnRecycle] Removed dead bot ${entry.originalBotId} from registry`);
                    }
                    const objectiveIndex = pickObjectiveForSpawn(entry.teamId);
                    spawnBotForTeam(entry.teamId, objectiveIndex);
                    log(`[SpawnRecycle] REPLACEMENT spawned for T${entry.teamId} at HQ (replacing bot ${entry.originalBotId})`);
                }
                spawned++;
                toRemove.push(i);
            } catch (e) {
                const errorStr = String(e);
                if (errorStr.includes("OutOfAISpawnQuota")) {
                    log(`[SpawnRecycle] REPLACEMENT spawn quota full - will retry`);
                } else {
                    log(`[SpawnRecycle] REPLACEMENT spawn error: ${e}`);
                    toRemove.push(i); // Remove failed entries
                }
            }
        }
        for (let i = toRemove.length - 1; i >= 0; i--) {
            replacementSpawnQueue.splice(toRemove[i], 1);
        }
        if (replacementSpawnQueue.length > 0) {
            logDebug(`[SpawnRecycle] ${replacementSpawnQueue.length} replacements pending`);
        }
    }
    function pickForwardSpawnObjective(teamId: number): number {
        const objectives = Registry_GetObjectives();
        const enemyTeamId = teamId === 1 ? 2 : 1;
        const eligible: number[] = [];
        try {
            const cps = mod.AllCapturePoints();
            const cpCount = mod.CountOf(cps);
            for (let ci = 0; ci < cpCount; ci++) {
                const cp = mod.ValueInArray(cps, ci) as mod.CapturePoint;
                if (!cp) continue;
                const objId = mod.GetObjId(cp);
                const objIdx = objectives.findIndex(o => o.objId === objId);
                if (objIdx < 0) continue;
                const obj = objectives[objIdx];
                if (obj.teamId !== teamId) continue;
                const players = mod.GetPlayersOnPoint(cp);
                const count = mod.CountOf(players);
                let friendlyCount = 0;
                let enemyCount = 0;
                for (let pi = 0; pi < count; pi++) {
                    const p = mod.ValueInArray(players, pi) as mod.Player;
                    if (!p) continue;
                    try {
                        const pTeamId = getPlayerTeamId(p);
                        if (pTeamId === teamId) friendlyCount++;
                        else if (pTeamId === enemyTeamId) enemyCount++;
                    } catch (_e) {}
                }
                if (enemyCount > 0 && friendlyCount === 0) {
                    eligible.push(objIdx);
                }
            }
        } catch (_e) {
            return -1;
        }
        if (eligible.length === 0) return -1;
        return eligible[Math.floor(Math.random() * eligible.length)];
    }
    function spawnBotAtObjective(teamId: number, objectiveIndex: number): void {
        if (!canSpawnScriptedBot(teamId)) {
            log(`[SpawnRecycle] Forward spawn quota guard: T${teamId} full`);
            return;
        }
        const spawnerId = getObjectiveSpawnerId(teamId, objectiveIndex);
        if (spawnerId === null) {
            log(`[SpawnRecycle] No objective spawner for T${teamId} obj${objectiveIndex}`);
            return;
        }
        const spawner = mod.GetSpawner(spawnerId);
        if (!spawner) {
            log(`[SpawnRecycle] Objective spawner ${spawnerId} not found in map`);
            return;
        }
        const classes = [
            mod.SoldierClass.Assault,
            mod.SoldierClass.Engineer,
            mod.SoldierClass.Support,
            mod.SoldierClass.Recon,
        ];
        const soldierClass = classes[classRotationIndex % classes.length];
        classRotationIndex++;
        const team = mod.GetTeam(teamId);
        if (!team) return;
        const name = nextBotName();
        const nameMsg = mod.Message(name);
        mod.SpawnAIFromAISpawner(spawner, soldierClass, nameMsg, team);
        objectiveLastSpawnTime.set(objectiveIndex, mod.GetMatchTimeElapsed());
        const objLetter = OBJECTIVES[objectiveIndex]?.id || String(objectiveIndex);
        log(`[SpawnRecycle] FORWARD SPAWN at objective ${objLetter} (spawner ${spawnerId}) for T${teamId}`);
    }
    function validateRegistry(): void {
        const currentTime = mod.GetMatchTimeElapsed();
        for (const [botId, entry] of botRegistry.entries()) {
            try {
                const timeSinceSpawn = currentTime - entry.spawnTime;
                if (timeSinceSpawn < SPAWN_PROTECTION_SECONDS) {
                    continue;
                }
                if (!mod.IsPlayerValid(entry.player)) {
                    if (entry.invalidSince === 0) {
                        entry.invalidSince = currentTime;
                    }
                    const invalidDuration = currentTime - entry.invalidSince;
                    if (invalidDuration > 45.0) {
                        log(`[SpawnRecycle] Bot ${botId} invalid for ${invalidDuration.toFixed(0)}s - removing from registry`);
                        botRegistry.delete(botId);
                        if (ENABLE_REPLACEMENT_SPAWN) {
                            replacementSpawnQueue.push({
                                teamId: entry.teamId,
                                deathTime: currentTime,
                                originalBotId: botId
                            });
                        }
                    }
                    continue;
                }
                if (entry.invalidSince !== 0) {
                    entry.invalidSince = 0;
                }
                if (!entry.isAlive) continue;
                if (!hasSoldier(entry.player)) {
                    continue;
                }
                const isAlive = mod.GetSoldierState(entry.player, mod.SoldierStateBool.IsAlive);
                if (entry.isAlive && !isAlive) {
                    if (entry.mandownTime > 0) {
                        log(`[SpawnRecycle] Bot ${botId} IsAlive=false but in ManDown (entered at ${entry.mandownTime.toFixed(1)}s) - skipping recycle`);
                        continue;
                    }
                    entry.isAlive = false;
                    entry.lastDeathTime = mod.GetMatchTimeElapsed();
                    log(`[SpawnRecycle] Bot ${botId} detected dead via validation - queued for recycle`);
                }
            } catch (e) {
                log(`[SpawnRecycle] Bot ${botId} validateRegistry exception (may be spawning): ${e}`);
            }
        }
    }
    export function SpawnRecycle_Reset(): void {
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        lastValidateTime = 0;
        lastStatusTime = 0;
        initialized = false;
        startCalled = false; // Reset start guard
        log(`[SpawnRecycle] Reset complete`);
    }
    export function SpawnRecycle_Init(): void {
        if (initialized) return;
        detectMapBehaviorMode();
        initBotNames();
        botRegistry.clear();
        objectiveLastSpawnTime.clear();
        initialSpawnRemaining.clear();
        replacementSpawnQueue.length = 0;  // Clear replacement queue
        initialSpawnPhase = false;
        lastInitialSpawnTime = 0;
        spawnerRotationIndex = 0;
        spawnPointRotationIndex = 0;
        classRotationIndex = 0;
        lastSpawnTime = 0;
        lastTickTime = 0;
        try {
            if (USE_AUTOSPAWN_MODE) {
                mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);
                log(`[SpawnRecycle] SetSpawnMode(AutoSpawn) - bots will auto-respawn`);
            } else {
                mod.SetSpawnMode(mod.SpawnModes.Deploy);
                log(`[SpawnRecycle] SetSpawnMode(Deploy) - manual deploy screen`);
            }
        } catch (e) {
            log(`[SpawnRecycle] Failed to set spawn mode: ${e}`);
        }
        if (RECYCLE_ENABLED) {
            const allSpawnerIds = [...TEAM1_AI_SPAWNER_IDS, ...TEAM2_AI_SPAWNER_IDS, ...TEAM1_OBJ_SPAWNER_IDS, ...TEAM2_OBJ_SPAWNER_IDS];
            for (const spawnerId of allSpawnerIds) {
                try {
                    const spawner = mod.GetSpawner(spawnerId);
                    if (spawner) {
                        mod.AISetUnspawnOnDead(spawner, false);
                        mod.SetUnspawnDelayInSeconds(spawner, 30); // prevents ManDown bots disappearing if AISetUnspawnOnDead is overridden
                        log(`[SpawnRecycle] Spawner ${spawnerId}: AISetUnspawnOnDead=false + 30s unspawn delay`);
                    }
                } catch (e) {
                    log(`[SpawnRecycle] Failed to configure spawner ${spawnerId}: ${e}`);
                }
            }
            log(`[SpawnRecycle] Recycling ENABLED - SetRedeployTime will trigger respawn`);
        } else {
            log(`[SpawnRecycle] Portal natural respawn mode - spawner handles respawns`);
        }
        cacheWaypointPaths();
        initialized = true;
    }
    let startCalled = false; // Prevent repeated calls to SpawnRecycle_Start
    export function SpawnRecycle_Start(): void {
        if (!initialized) {
            SpawnRecycle_Init();
        }
        if (startCalled) return;
        startCalled = true;
        startInitialSpawn();
    }
    let lastValidateTime = 0;
    const VALIDATE_INTERVAL = 3.0; // Validate registry every 3 seconds
    let lastStatusTime = 0;
    const STATUS_INTERVAL = 15.0; // Log status every 15 seconds
    let lastRecycleTime = 0;
    const RECYCLE_INTERVAL = 1.0; // Process dead bot recycling every 1 second
    export function SpawnRecycle_Tick(): void {
        if (!initialized) return;
        const currentTime = mod.GetMatchTimeElapsed();
        if (currentTime - lastTickTime < 0.5) return;
        lastTickTime = currentTime;
        if (initialSpawnPhase) {
            processInitialSpawnBatch(currentTime);
        }
        processReplacementSpawns(currentTime);
        if (currentTime - lastValidateTime >= VALIDATE_INTERVAL) {
            validateRegistry();
            lastValidateTime = currentTime;
        }
        if (currentTime - lastStatusTime >= STATUS_INTERVAL) {
            const t1Alive = getAliveBotsForTeam(1).length;
            const t2Alive = getAliveBotsForTeam(2).length;
            const t1Total = getTotalBotsForTeam(1);
            const t2Total = getTotalBotsForTeam(2);
            const t1Dead = t1Total - t1Alive;
            const t2Dead = t2Total - t2Alive;
            log(`[SpawnRecycle] STATUS (Mode ${BEHAVIOR_MODE}): T1=${t1Alive}/${t1Total} alive (${t1Dead} dead) | T2=${t2Alive}/${t2Total} alive (${t2Dead} dead)`);
            if (initialSpawnPhase) {
                const t1Remaining = initialSpawnRemaining.get(1) || 0;
                const t2Remaining = initialSpawnRemaining.get(2) || 0;
                log(`[SpawnRecycle] Initial spawn in progress: T1 needs ${t1Remaining}, T2 needs ${t2Remaining}`);
            }
            lastStatusTime = currentTime;
        }
        tickWaypointArrivals();
    }
    export function SpawnRecycle_GetStats(): { team1Alive: number; team2Alive: number; team1Total: number; team2Total: number } {
        return {
            team1Alive: getAliveBotsForTeam(1).length,
            team2Alive: getAliveBotsForTeam(2).length,
            team1Total: getTotalBotsForTeam(1),
            team2Total: getTotalBotsForTeam(2),
        };
    }
    export function SpawnRecycle_ActivateAllBots(): void {
        const currentTime = mod.GetMatchTimeElapsed();
        let activated = 0;
        for (const [botId, entry] of botRegistry.entries()) {
            if (!entry.isAlive) continue;
            try {
                if (!mod.IsPlayerValid(entry.player)) continue;
                if (!hasSoldier(entry.player)) continue;
                enableBotGadgets(entry.player);  // includes targeting + shooting
                const objectiveIndex = entry.assignedObjectiveIndex;
                if (applyWaypointRouting(entry.player, botId, objectiveIndex)) {
                    entry.waypointActive = true;
                    entry.waypointStartTime = currentTime;
                } else {
                    safeApplyBehavior(entry.player, () => mod.AIBattlefieldBehavior(entry.player), "AIBattlefieldBehavior");
                    entry.waypointActive = false;
                }
                activated++;
            } catch (e) {
                log(`[SpawnRecycle] ActivateBot ${botId} error: ${e}`);
            }
        }
        log(`[SpawnRecycle] === ACTIVATED ${activated} bots (idle -> battlefield) ===`);
    }
    export function SpawnRecycle_OnHumanDeployed(player: mod.Player): void {
        SpawnRecycle_OnPlayerDeployed(player);
    }
    export function SpawnRecycle_OnPlayerDeployed(player: mod.Player): void {
        if (!initialized) return;
        if (!player) return;
        const botId = mod.GetObjId(player);
        const currentTime = mod.GetMatchTimeElapsed();
        log(`[SpawnRecycle] >>> OnPlayerDeployed fired for player ${botId}`);
        try {
            let isAI = false;
            try {
                isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            } catch (stateError) {
                log(`[SpawnRecycle] GetSoldierState threw for ${botId}: ${stateError}`);
                const entry = botRegistry.get(botId);
                if (entry) {
                    log(`[SpawnRecycle] Bot ${botId} is in registry, treating as AI`);
                    isAI = true;
                }
            }
            if (!isAI) {
                log(`[SpawnRecycle] Player ${botId} is not AI, skipping`);
                return;
            }
            const teamId = getPlayerTeamId(player);
            const entry = botRegistry.get(botId);
            if (entry) {
                logDebug(`[SpawnRecycle] Bot ${botId} found in registry, isAlive=${entry.isAlive}, pendingRecycle=${entry.pendingRecycle}`);
                if (!entry.isAlive || entry.pendingRecycle) {
                    entry.isAlive = true;
                    entry.pendingRecycle = false;  // Clear pending flag
                    entry.pendingRecycleTime = 0;  // Clear timeout tracker
                    entry.redeployTimeCalled = false;  // Reset for next death cycle
                    entry.spawnTime = mod.GetMatchTimeElapsed();
                    entry.lastDeathTime = 0;  // Clear death time
                    entry.spawnCount++;
                    const objectiveIndex = pickObjectiveForSpawn(teamId);
                    entry.assignedObjectiveIndex = objectiveIndex;
                    log(`[SpawnRecycle] RECYCLED bot ${botId} (spawn #${entry.spawnCount}) - applying Mode ${BEHAVIOR_MODE}`);
                    applyAndLogBotHealth(player, botId, teamId, "SCRIPTED/RECYCLED");
                    const currentTime = mod.GetMatchTimeElapsed();
                    applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
                } else {
                    applyAndLogBotHealth(player, botId, teamId, "SCRIPTED/INITIAL");
                    logDebug(`[SpawnRecycle] Bot ${botId} already alive, skipping (handled by OnSpawnerSpawned)`);
                    return;
                }
            } else {
                const objectiveIndex = pickObjectiveForSpawn(teamId);
                log(`[SpawnRecycle] STATIC bot ${botId} deployed (team ${teamId}) - applying Mode ${BEHAVIOR_MODE}`);
                applyAndLogBotHealth(player, botId, teamId, "STATIC/BACKFILL");
                const currentTime = mod.GetMatchTimeElapsed();
                applyBehaviorToBot(player, botId, objectiveIndex, currentTime);
            }
        } catch (e) {
            log(`[SpawnRecycle] OnPlayerDeployed error for ${botId}: ${e}`);
        }
    }
}


// Module: modules/AILoadoutModule.ts
namespace ConquestV8 {
    export function equipAILoadout(bot: mod.Player): void {
        try {
            const soldierClass = getSoldierClass(bot);
            switch (soldierClass) {
                case "Assault":
                    equipAssaultLoadout(bot);
                    break;
                case "Engineer":
                    equipEngineerLoadout(bot);
                    break;
                case "Support":
                    equipSupportLoadout(bot);
                    break;
                case "Recon":
                    equipReconLoadout(bot);
                    break;
                default:
                    equipAssaultLoadout(bot); // Fallback
            }
            mod.AIGadgetSettings(bot, false, false, false);
            log(`[AILoadout] Equipped ${soldierClass} loadout for bot ${mod.GetObjId(bot)}`);
        } catch (e) {
            log(`[AILoadout] Failed to equip bot ${mod.GetObjId(bot)}: ${e}`);
        }
    }
    function getSoldierClass(bot: mod.Player): string {
        try {
            const roll = Math.random();
            if (roll < 0.30) return "Assault";
            if (roll < 0.55) return "Engineer";
            if (roll < 0.80) return "Support";
            return "Recon";
        } catch (e) {
            return "Assault";
        }
    }
    function equipAssaultLoadout(bot: mod.Player): void {
        const useSLM = Math.random() < 0.20;
        if (useSLM) {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Aim_Guided, mod.InventorySlots.GadgetOne);
        } else {
            mod.AddEquipment(bot, mod.Gadgets.Launcher_Unguided_Rocket, mod.InventorySlots.GadgetOne);
        }
        mod.AddEquipment(bot, mod.Gadgets.Class_Adrenaline_Injector, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    function equipEngineerLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Class_Repair_Tool, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Anti_Vehicle_Mine, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Fragmentation_Grenade, mod.InventorySlots.Throwable);
    }
    function equipSupportLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Class_Supply_Bag, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Launcher_Air_Defense, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
    function equipReconLoadout(bot: mod.Player): void {
        mod.AddEquipment(bot, mod.Gadgets.Deployable_Deploy_Beacon, mod.InventorySlots.ClassGadget);
        mod.AddEquipment(bot, mod.Gadgets.Misc_Demolition_Charge, mod.InventorySlots.GadgetOne);
        mod.AddEquipment(bot, mod.Gadgets.Throwable_Smoke_Grenade, mod.InventorySlots.Throwable);
    }
}


// Module: modules/DirectorModule.ts
namespace ConquestV8 {
    let initialized = false;
    let lastNudgeTime = 0;
    const lastNudgeByPlayerId: Map<number, number> = new Map();
    const lastPositionByPlayerId: Map<number, { x: number; y: number; z: number; time: number }> = new Map();
    const NUDGE_INTERVAL_SECONDS = 30.0;      // Only check every 30 seconds
    const IDLE_THRESHOLD_SECONDS = 20.0;      // Bot must be idle for 20s before nudge
    const IDLE_DISTANCE_THRESHOLD = 5.0;      // Bot must move less than 5m to be "idle"
    const MIN_NUDGE_INTERVAL_PER_BOT = 60.0;  // Don't nudge same bot more than once per minute
    const MAX_NUDGES_PER_TICK = 2;            // Maximum bots to nudge per tick (prevent spam)
    export function Director_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[Director V8] Initialized - soft-influence mode (nudge interval: " + NUDGE_INTERVAL_SECONDS + "s)");
    }
    export function Director_Tick(currentTime: number): void {
        if (currentTime - lastNudgeTime < NUDGE_INTERVAL_SECONDS) {
            return;
        }
        lastNudgeTime = currentTime;
        if (lastNudgeByPlayerId.size > 128) lastNudgeByPlayerId.clear();
        if (lastPositionByPlayerId.size > 128) lastPositionByPlayerId.clear();
        for (const teamId of [1, 2]) {
            processTeamNudges(teamId, currentTime);
        }
    }
    function processTeamNudges(teamId: number, currentTime: number): void {
        const suggestedObj = ObjectiveBias_GetSuggestedObjective(teamId);
        if (!suggestedObj) {
            logDebugKey(`Director:NoSuggestion:T${teamId}`, 
                `[Director V8] Team ${teamId}: No suggested objective from bias module`, 30.0);
            return;
        }
        const configObj = getObjectiveByObjId(suggestedObj.objId);
        if (!configObj) return;
        const idleBots = findIdleBots(teamId, currentTime);
        if (idleBots.length === 0) {
            logDebugKey(`Director:NoIdleBots:T${teamId}`,
                `[Director V8] Team ${teamId}: No idle bots detected`, 30.0);
            return;
        }
        logDebugKey(`Director:IdleBots:T${teamId}`,
            `[Director V8] Team ${teamId}: ${idleBots.length} idle bots, suggesting ${suggestedObj.letter}`, 15.0);
        let nudgeCount = 0;
        for (const bot of idleBots) {
            if (nudgeCount >= MAX_NUDGES_PER_TICK) break;
            const playerId = getPlayerId(bot);
            if (playerId < 0) continue;
            const lastNudge = lastNudgeByPlayerId.get(playerId) ?? 0;
            if (currentTime - lastNudge < MIN_NUDGE_INTERVAL_PER_BOT) continue;
            if (applyNudge(bot, configObj, currentTime)) {
                lastNudgeByPlayerId.set(playerId, currentTime);
                nudgeCount++;
            }
        }
        if (nudgeCount > 0) {
            log(`[Director V8] Team ${teamId}: Nudged ${nudgeCount} idle bots toward ${suggestedObj.letter}`);
        }
    }
    function findIdleBots(teamId: number, currentTime: number): mod.Player[] {
        const idleBots: mod.Player[] = [];
        try {
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                if (getPlayerTeamId(player) !== teamId) continue;
                if (!isAISoldier(player)) continue;
                if (!isAlive(player)) continue;
                if (isInVehicle(player)) continue;
                if (isPlayerIdle(player, currentTime)) {
                    idleBots.push(player);
                }
            }
        } catch (e) {
            logError("[Director V8] Error finding idle bots: " + e);
        }
        return idleBots;
    }
    function isPlayerIdle(player: mod.Player, currentTime: number): boolean {
        const playerId = getPlayerId(player);
        if (playerId < 0) return false;
        const rawPos = ConquestV8.safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        if (!rawPos) return false;
        const currentPos = {
            x: mod.XComponentOf(rawPos),
            y: mod.YComponentOf(rawPos),
            z: mod.ZComponentOf(rawPos)
        };
        const lastPos = lastPositionByPlayerId.get(playerId);
        if (!lastPos) {
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        const dx = currentPos.x - lastPos.x;
        const dy = currentPos.y - lastPos.y;
        const dz = currentPos.z - lastPos.z;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distanceMoved > IDLE_DISTANCE_THRESHOLD) {
            lastPositionByPlayerId.set(playerId, { ...currentPos, time: currentTime });
            return false;
        }
        const idleTime = currentTime - lastPos.time;
        if (idleTime >= IDLE_THRESHOLD_SECONDS) {
            return true;
        }
        return false;
    }
    function applyNudge(player: mod.Player, _targetObj: Objective, _currentTime: number): boolean {
        try {
            mod.AIBattlefieldBehavior(player);
            const playerId = getPlayerId(player);
            if (playerId >= 0) {
                lastPositionByPlayerId.delete(playerId);
            }
            return true;
        } catch (e) {
            logError("[Director V8] Failed to nudge bot: " + e);
            return false;
        }
    }
    function getPlayerId(player: mod.Player): number {
        try {
            return mod.GetObjId(player);
        } catch (_e) {
            return -1;
        }
    }
    function getPlayerTeamId(player: mod.Player): number {
        try {
            const team = mod.GetTeam(player);
            return mod.GetObjId(team);
        } catch (_e) {
            return 0;
        }
    }
    function isAISoldier(player: mod.Player): boolean {
        return ConquestV8.safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAISoldier);
    }
    function isAlive(player: mod.Player): boolean {
        return ConquestV8.safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
    }
    function isInVehicle(player: mod.Player): boolean {
        return ConquestV8.safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
    }
    function getPlayerPosition(player: mod.Player): { x: number; y: number; z: number } | null {
        const pos = ConquestV8.safeGetSoldierStateVector(player, mod.SoldierStateVector.GetPosition);
        if (!pos) return null;
        return {
            x: mod.XComponentOf(pos),
            y: mod.YComponentOf(pos),
            z: mod.ZComponentOf(pos)
        };
    }
    function createPos(x: number, y: number, z: number): mod.Vector {
        return mod.CreateVector(x, y, z);
    }
    export function Director_Reset(): void {
        initialized = false;
        lastNudgeTime = 0;
        lastNudgeByPlayerId.clear();
        lastPositionByPlayerId.clear();
        log("[Director V8] Reset");
    }
}


// Module: modules/VehicleDirectorModule.ts
namespace ConquestV8 {
    let vehicleModuleInitialized = false;
    let vehicleSpawnersConfigured = false;
    let spawnerVerifyTime = -9999;
    function verifySpawnerSettings(): void {
        const t = now(true);
        if (t - spawnerVerifyTime < 10.0) return; // Check every 10 seconds
        spawnerVerifyTime = t;
        log("[ConquestV10][VehicleDirector] Verifying spawners exist...");
        let okCount = 0;
        let problemCount = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) {
                    log(`[ConquestV10][VehicleDirector] VERIFY: Spawner ${spawnerId} is null`);
                    problemCount++;
                } else {
                    okCount++;
                }
            } catch (e) {
                log(`[ConquestV10][VehicleDirector] VERIFY ERROR: Spawner ${spawnerId}: ${e}`);
                problemCount++;
            }
        }
        log(`[ConquestV10][VehicleDirector] Spawner verification: ${okCount} OK, ${problemCount} problems`);
    }
    let lastVehicleCheckTime = -9999;
    let lastSkyJetCheckTime = -9999;
    let unlockSweepDone = false;
    let lastGroundInitSweepTime = -9999;
    let lastSpawnerInitSweepTime = -9999;
    let groundSpawnerSpawnDone = false;
    const lastSkyJetSpawnAttemptBySpawner: { [spawnerId: number]: number } = {};
    const nextSkyJetSpawnerIndex: { [teamId: number]: number } = { 1: 0, 2: 0 };
    const recentlyProcessedVehicles: Map<number, number> = new Map();
    const VEHICLE_COOLDOWN_SECONDS = 10.0;
    const lastSeatDebugByVehicleId: Map<number, number> = new Map();
    const vehicleTeamCacheByVehicleId: Map<number, number> = new Map();
    const lastJetBehaviorByPilotId: Map<number, number> = new Map();
    const jetPilotsWithBehavior: Set<number> = new Set();
    const GROUND_VEHICLE_SPAWNER_IDS = [
        202, 203, 204, 207, 208, 238, 242, 252, 253, 293, 294, 295,
        209, 211, 215, 234, 239, 241, 244, 248, 249, 291, 292, 296
    ];
    const TEAM1_GROUND_VEHICLE_SPAWNER_IDS = [202, 203, 204, 207, 208, 238, 242, 252, 253, 293, 294, 295];
    const TEAM2_GROUND_VEHICLE_SPAWNER_IDS = [209, 211, 215, 234, 239, 241, 244, 248, 249, 291, 292, 296];
    const SKY_JET_SPAWNER_IDS_ALL = [232, 243, 247, 233];
    const TEAM1_SKY_JET_SPAWNERS = [232, 243];  // F22, F16
    const TEAM2_SKY_JET_SPAWNERS = [247, 233];  // JAS39, SU57
    function isRunwayJetMap(): boolean {
        return getCurrentMapName() === "Badlands";
    }
    function getActiveSkyJetSpawnerIds(): number[] {
        if (isRunwayJetMap()) return [];  // Runway jets - don't disable auto-spawn
        return SKY_JET_SPAWNER_IDS_ALL;
    }
    const ALL_VEHICLE_SPAWNER_IDS = [...GROUND_VEHICLE_SPAWNER_IDS, ...SKY_JET_SPAWNER_IDS_ALL];
    const vehicleSpawnerPositions: mod.Vector[] = [];
    const vehicleSpawnerPositionsByTeam: { pos: mod.Vector; teamId: number }[] = [];
    let vehicleSpawnerPositionsCached = false;
    const USE_MAP_ABANDONMENT_SETTINGS = true; // Set to false to override with script values
    const SCRIPT_ABANDON_TIME = 30.0;   // Only used if USE_MAP_ABANDONMENT_SETTINGS=false
    const SCRIPT_ABANDON_RADIUS = 50.0; // Only used if USE_MAP_ABANDONMENT_SETTINGS=false
    function configureVehicleSpawners(): void {
        if (vehicleSpawnersConfigured) return;
        vehicleSpawnersConfigured = true;
        log("[ConquestV10][VehicleDirector] Configuring vehicle spawner settings (preserving map abandonment)...");
        let successCount = 0;
        let failCount = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            safeCall(`ConfigureSpawner_${spawnerId}`, () => {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) {
                    log(`[ConquestV10][VehicleDirector] Spawner ${spawnerId} not found`);
                    failCount++;
                    return;
                }
                const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
                if (spawnerPos) {
                    vehicleSpawnerPositions.push(spawnerPos);
                    let teamId = 0;
                    if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 1;
                    else if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 2;
                    if (teamId) vehicleSpawnerPositionsByTeam.push({ pos: spawnerPos, teamId });
                }
                const activeSkyJets = getActiveSkyJetSpawnerIds();
                const isSkyJet = activeSkyJets.includes(spawnerId);
                if (isSkyJet) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                } else if (!PRESERVE_MAP_GROUND_AUTOSPAWN) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                }
                if (USE_MAP_ABANDONMENT_SETTINGS) {
                    if (isSkyJet) {
                        log(`[ConquestV10][VehicleDirector] Sky jet spawner ${spawnerId} - auto-spawn DISABLED, map abandonment preserved`);
                    } else if (PRESERVE_MAP_GROUND_AUTOSPAWN) {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn PRESERVED (map), map abandonment preserved`);
                    } else {
                        log(`[ConquestV10][VehicleDirector] Ground spawner ${spawnerId} - auto-spawn DISABLED (script), map abandonment preserved`);
                    }
                } else {
                    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, SCRIPT_ABANDON_TIME);
                    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
                    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
                    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, SCRIPT_ABANDON_RADIUS);
                    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, SCRIPT_ABANDON_RADIUS);
                    log(`[ConquestV10][VehicleDirector] Spawner ${spawnerId} - script override: abandon=${SCRIPT_ABANDON_TIME}s, damage=true`);
                }
                successCount++;
            });
        }
        vehicleSpawnerPositionsCached = true;
        log(`[ConquestV10][VehicleDirector] Vehicle spawners configured: ${successCount} success, ${failCount} failed`);
    }
    function ensureVehicleSpawnerPositions(): void {
        if (vehicleSpawnerPositionsCached && vehicleSpawnerPositions.length > 0) return;
        vehicleSpawnerPositions.length = 0;
        vehicleSpawnerPositionsByTeam.length = 0;
        for (const spawnerId of ALL_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) continue;
                const pos = getObjectPos(spawner as unknown as mod.Object);
                if (pos) {
                    vehicleSpawnerPositions.push(pos);
                    let teamId = 0;
                    if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 1;
                    else if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) teamId = 2;
                    if (teamId) vehicleSpawnerPositionsByTeam.push({ pos, teamId });
                }
            } catch (_e) {
            }
        }
        vehicleSpawnerPositionsCached = true;
    }
    function isNearAnyVehicleSpawner(position: mod.Vector, radiusMeters: number): boolean {
        for (const spawnerPos of vehicleSpawnerPositions) {
            if (distance3D(position, spawnerPos) <= radiusMeters) return true;
        }
        return false;
    }
    export function isPositionNearVehicleSpawner(position: mod.Vector, radiusMeters: number): boolean {
        ensureVehicleSpawnerPositions();
        return isNearAnyVehicleSpawner(position, radiusMeters);
    }
    export function getVehicleSpawnerPositions(): mod.Vector[] {
        ensureVehicleSpawnerPositions();
        return [...vehicleSpawnerPositions];
    }
    export function getVehicleSpawnerPositionsForTeam(teamId: number): mod.Vector[] {
        ensureVehicleSpawnerPositions();
        return vehicleSpawnerPositionsByTeam
            .filter((entry) => entry.teamId === teamId)
            .map((entry) => entry.pos);
    }
    export function initVehicleDirector(): void {
        vehicleModuleInitialized = true;
        vehicleSpawnersConfigured = false;
        lastVehicleCheckTime = -9999;
        lastSkyJetCheckTime = -9999;
        for (const id of SKY_JET_SPAWNER_IDS_ALL) {
            lastSkyJetSpawnAttemptBySpawner[id] = -9999;
        }
        recentlyProcessedVehicles.clear();
        lastJetBehaviorByPilotId.clear();
        jetPilotsWithBehavior.clear();
        lastSeatDebugByVehicleId.clear();
        vehicleTeamCacheByVehicleId.clear();
        configureVehicleSpawners();
        log("[ConquestV10][VehicleDirector] Initialized (v2 - reduced spam + abandonment config)");
    }
    function shouldRefreshJetBehavior(pilotId: number, nowTime: number): boolean {
        const last = lastJetBehaviorByPilotId.get(pilotId) ?? -9999;
        return nowTime - last >= SKY_JET_BEHAVIOR_REFRESH_SECONDS;
    }
    function markJetBehaviorApplied(pilotId: number, nowTime: number): void {
        lastJetBehaviorByPilotId.set(pilotId, nowTime);
    }
    function cleanupJetBehaviorCache(): void {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            const count = mod.CountOf(allPlayers);
            const activeIds = new Set<number>();
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                try {
                    if (!hasSoldier(p)) continue;
                    if (!isAlive(p)) continue;
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (!inVehicle) continue;
                    activeIds.add(mod.GetObjId(p));
                } catch (_e) {
                }
            }
            for (const pid of lastJetBehaviorByPilotId.keys()) {
                if (!activeIds.has(pid)) {
                    lastJetBehaviorByPilotId.delete(pid);
                }
            }
        } catch (_e) {
        }
    }
    function getSkyJetVehicleTypeForSpawner(spawnerId: number): mod.VehicleList {
        switch (spawnerId) {
            case 232: return mod.VehicleList.F22;     // Team 1 F22
            case 243: return mod.VehicleList.F16;     // Team 1 F16
            case 247: return mod.VehicleList.JAS39;   // Team 2 JAS39
            case 233: return mod.VehicleList.SU57;    // Team 2 SU57
            default:  return mod.VehicleList.F16;     // Fallback
        }
    }
    function getSkyJetVehicleTypeForTeam(teamId: number): mod.VehicleList {
        return teamId === 1 ? mod.VehicleList.F16 : mod.VehicleList.SU57;
    }
    function getSkyJetSpawnerIdForTeam(teamId: number): number {
        const spawners = teamId === 1 ? TEAM1_SKY_JET_SPAWNERS : TEAM2_SKY_JET_SPAWNERS;
        const idx = nextSkyJetSpawnerIndex[teamId] || 0;
        const spawnerId = spawners[idx];
        nextSkyJetSpawnerIndex[teamId] = (idx + 1) % spawners.length;
        return spawnerId;
    }
    function getObjectPos(obj: mod.Object): mod.Vector | null {
        try {
            return mod.GetObjectPosition(obj);
        } catch (_e) {
            return null;
        }
    }
    function getHQPositionForTeam(teamId: number): mod.Vector | null {
        const aiSpawnerIds = teamId === 1 ? TEAM1_AI_SPAWNER_IDS : TEAM2_AI_SPAWNER_IDS;
        for (const spawnerId of aiSpawnerIds) {
            try {
                const spawner = mod.GetSpawner(spawnerId);
                if (spawner) {
                    const pos = getObjectPos(spawner as unknown as mod.Object);
                    if (pos) return pos;
                }
            } catch (_e) {
            }
        }
        return null;
    }
    function findNearestVehicleOfTypeNear(type: mod.VehicleList, near: mod.Vector, maxDist: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            let best: mod.Vehicle | null = null;
            let bestDist = 1e30;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) {
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const d = distance3D(vPos, near);
                if (d <= maxDist && d < bestDist) {
                    best = v;
                    bestDist = d;
                }
            }
            return best;
        } catch (_e) {
            return null;
        }
    }
    function countOccupiedVehiclesOfTypeForTeam(type: mod.VehicleList, teamId: number): number {
        let countOccupied = 0;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return 0;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) {
                    continue;
                }
                try {
                    if (!mod.IsVehicleOccupied(v)) continue;
                } catch (_e) {
                    continue;
                }
                    const vTeamId = getVehicleTeamIdSafe(v);
                    if (vTeamId === teamId) {
                        countOccupied++;
                    }
            }
        } catch (_e) {
        }
        return countOccupied;
    }
    function pickJetPilot(teamId: number): mod.Player | null {
        return pickAnyBotOnFoot(teamId);
    }
    function findAnyAIOccupantInVehicle(vehicle: mod.Vehicle, teamId: number): mod.Player | null {
        try {
            const vId = mod.GetObjId(vehicle);
            const allPlayers = mod.AllPlayers();
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (getPlayerTeamId(p) !== teamId) continue;
                if (!hasSoldier(p)) continue;
                if (!isAlive(p)) continue;  // Dead/ManDown players cause InvalidValue
                let inVehicle = false;
                try {
                    inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                } catch (_e) {
                    inVehicle = false;
                }
                if (!inVehicle) continue;
                const pv = safeGetVehicleFromPlayer(p);
                if (!pv) continue;
                try {
                    if (mod.GetObjId(pv) !== vId) continue;
                    return p;
                } catch (_e) {
                }
            }
        } catch (_e) {
        }
        return null;
    }
    function applyJetPilotBehavior(pilot: mod.Player, teamId: number, spawnerId: number): void {
        const applyIfStillInVehicle = (): void => {
            if (!pilot) return;
            if (!hasSoldier(pilot)) return;
            if (!isAlive(pilot)) return;
            const v = safeGetVehicleFromPlayer(pilot);
            if (!v) return;
            if (DEBUG_SKY_JETS) {
                logDebugKey(
                    `SkyJets:Behavior:T${teamId}`,
                    `[ConquestV10][SkyJets] Apply behavior: team=${teamId} spawner=${spawnerId} pilotObjId=${mod.GetObjId(pilot)}`,
                    2.0
                );
            }
            safeCall("SkyJets:AIBattlefieldBehavior", () => mod.AIBattlefieldBehavior(pilot));
        };
        void (async () => {
            await mod.Wait(0.05);
            applyIfStillInVehicle();
            await mod.Wait(0.20);
            applyIfStillInVehicle();
            await mod.Wait(0.75);
            applyIfStillInVehicle();
        })();
    }
    function findVehicleOfTypeForTeam(type: mod.VehicleList, teamId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) { continue; }
                const vTeamId = getVehicleTeamIdSafe(v);
                if (vTeamId === teamId || vTeamId === 0) return v;
            }
        } catch (_e) {}
        return null;
    }
    function findEmptyVehicleOfTypeForTeam(type: mod.VehicleList, teamId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                try {
                    if (!mod.CompareVehicleName(v, type)) continue;
                } catch (_e) { continue; }
                const vTeamId = getVehicleTeamIdSafe(v);
                if (vTeamId !== teamId && vTeamId !== 0) continue;
                try {
                    if (mod.IsVehicleOccupied(v)) continue;
                } catch (_e) { continue; }
                return v;
            }
        } catch (_e) {}
        return null;
    }
    function tickSkyJets(): void {
        if (!ENABLE_AI_SKY_JETS) return;
        const t = now(true);
        if (t - lastSkyJetCheckTime < AI_SKY_JET_CHECK_INTERVAL_SECONDS) return;
        lastSkyJetCheckTime = t;
        const runwayMap = isRunwayJetMap();
        for (const teamId of [1, 2]) {
            const spawnerId = getSkyJetSpawnerIdForTeam(teamId);
            const spawner = mod.GetVehicleSpawner(spawnerId);
            if (!spawner) continue;
            const type = getSkyJetVehicleTypeForSpawner(spawnerId);
            const existing = findVehicleOfTypeForTeam(type, teamId);
            if (existing) {
                const pilotInJet = findAnyAIOccupantInVehicle(existing, teamId);
                if (pilotInJet) {
                    const pilotId = mod.GetObjId(pilotInJet);
                    if (!jetPilotsWithBehavior.has(pilotId) || shouldRefreshJetBehavior(pilotId, t)) {
                        applyJetPilotBehavior(pilotInJet, teamId, spawnerId);
                        jetPilotsWithBehavior.add(pilotId);
                        markJetBehaviorApplied(pilotId, t);
                    }
                }
                let occupied = false;
                try { occupied = mod.IsVehicleOccupied(existing); } catch (_e) { occupied = true; }
                if (!occupied && !vehicleUI_IsVehicleReservedForHuman(existing)) {
                    const pilot = pickJetPilot(teamId);
                    if (pilot) {
                        trySeatBotQuick(pilot, existing, -1);
                        trySeatBotQuick(pilot, existing, 0);
                        log(`[SkyJets] Seated bot in existing ${type === mod.VehicleList.F22 ? 'F22' : type === mod.VehicleList.JAS39 ? 'JAS39' : 'jet'} for team ${teamId}`);
                        const pilotId = mod.GetObjId(pilot);
                        applyJetPilotBehavior(pilot, teamId, spawnerId);
                        jetPilotsWithBehavior.add(pilotId);
                        markJetBehaviorApplied(pilotId, t);
                    }
                }
                continue;
            }
            if (runwayMap) continue;
            if (vehicleUI_IsSpawnerReservedForHuman(spawnerId)) {
                continue;
            }
            if (countOccupiedVehiclesOfTypeForTeam(type, teamId) >= 1) {
                continue;
            }
            if (t - (lastSkyJetSpawnAttemptBySpawner[spawnerId] ?? -9999) < AI_SKY_JET_SPAWN_COOLDOWN_SECONDS) {
                continue;
            }
            lastSkyJetSpawnAttemptBySpawner[spawnerId] = t;
            const pilot = pickJetPilot(teamId);
            if (!pilot) {
                log(`[SkyJets] No pilot available for team ${teamId}`);
                continue;
            }
            log(`[SkyJets] Spawning jet for team ${teamId}, spawner ${spawnerId}`);
            try {
                mod.ForceVehicleSpawnerSpawn(spawner);
            } catch (_e) {
                continue;
            }
            void (async () => {
                for (let attempt = 0; attempt < 6; attempt++) {
                    await mod.Wait(0.05);
                    const v = findEmptyVehicleOfTypeForTeam(type, teamId);
                    if (!v) continue;
                    trySeatBotQuick(pilot, v, -1);
                    trySeatBotQuick(pilot, v, 0);
                    log(`[SkyJets] Seated bot in new jet for team ${teamId} (attempt ${attempt + 1})`);
                    applyJetPilotBehavior(pilot, teamId, spawnerId);
                    const pId = mod.GetObjId(pilot);
                    jetPilotsWithBehavior.add(pId);
                    markJetBehaviorApplied(pId, now(true));
                    break;
                }
            })();
        }
    }
    export function VehicleDirector_OnVehicleSpawned(_vehicle: mod.Vehicle): void {
    }
    function ensureVehicleInit(): void {
        if (!vehicleModuleInitialized) {
            initVehicleDirector();
        }
    }
    export function VehicleDirector_PreRoundTick(): void {
        ensureVehicleInit();
        safeCall("VehicleDirector:GroundSpawnerSpawn", () => runGroundSpawnerAutoSpawnOnce());
    }
    function getSoldierPos(p: mod.Player): mod.Vector | null {
        try {
            if (!isAlive(p)) return null;
            return mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
        } catch (_e) {
            return null;
        }
    }
    function pickAnyBotOnFoot(teamId: number): mod.Player | null {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return null;
            const t1 = mod.GetTeam(1);
            const t2 = mod.GetTeam(2);
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                try {
                    const pTeam = mod.GetTeam(p);
                    if (!pTeam) continue;
                    let pTeamNorm = 0;
                    if (t1 && mod.GetObjId(pTeam) === mod.GetObjId(t1)) pTeamNorm = 1;
                    else if (t2 && mod.GetObjId(pTeam) === mod.GetObjId(t2)) pTeamNorm = 2;
                    if (pTeamNorm !== teamId) continue;
                } catch (_e) {
                    continue;
                }
                if (!isAlive(p)) continue;
                const vehicle = getVehicleFromPlayerSafe(p);
                if (vehicle) continue;
                return p;
            }
        } catch (_e) {
        }
        return null;
    }
    function pickNearestBotOnFootToPosition(pos: mod.Vector, maxDistance: number = 150): mod.Player | null {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return null;
            let nearestBot: mod.Player | null = null;
            let nearestDist = maxDistance;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (!isAlive(p)) continue;
                const vehicle = getVehicleFromPlayerSafe(p);
                if (vehicle) continue; // skip bots already in vehicles
                try {
                    const soldierPos = mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
                    if (!soldierPos) continue;
                    const dx = mod.XComponentOf(pos) - mod.XComponentOf(soldierPos);
                    const dy = mod.YComponentOf(pos) - mod.YComponentOf(soldierPos);
                    const dz = mod.ZComponentOf(pos) - mod.ZComponentOf(soldierPos);
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestBot = p;
                    }
                } catch (_e) {
                    continue;
                }
            }
            return nearestBot;
        } catch (_e) {
        }
        return null;
    }
    function getVehiclePos(v: mod.Vehicle): mod.Vector | null {
        try {
            return mod.GetVehicleState(v, mod.VehicleStateVector.VehiclePosition);
        } catch (_e) {
            return null;
        }
    }
    function distance3D(a: mod.Vector, b: mod.Vector): number {
        const dx = mod.XComponentOf(a) - mod.XComponentOf(b);
        const dy = mod.YComponentOf(a) - mod.YComponentOf(b);
        const dz = mod.ZComponentOf(a) - mod.ZComponentOf(b);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    function getVehicleFromPlayerSafe(p: mod.Player): mod.Vehicle | null {
        if (!p) return null;
        if (!hasSoldier(p)) return null;
        if (!isAlive(p)) return null;  // Dead/ManDown players cause InvalidValue
        try {
            const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
            if (!inVehicle) return null;
        } catch (_e) {
            return null;
        }
        try {
            const v = mod.GetVehicleFromPlayer(p);
            return v ?? null;
        } catch (_e) {
            return null;
        }
    }
    function isAlive(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsAlive) === true;
        } catch (_e) {
            return false;
        }
    }
    function safeGetVehicleObjId(v: mod.Vehicle): number {
        try {
            return mod.GetObjId(v);
        } catch (_e) {
            return -1;
        }
    }
    function getVehicleTeamId(v: mod.Vehicle): number {
        const vId = safeGetVehicleObjId(v);
        if (vId <= 0) return 0;
        try {
            const team = mod.GetVehicleTeam(v);
            if (!team) return 0;
            const t1 = mod.GetTeam(1);
            const t2 = mod.GetTeam(2);
            if (t1 && mod.GetObjId(team) === mod.GetObjId(t1)) {
                vehicleTeamCacheByVehicleId.set(vId, 1);
                return 1;
            }
            if (t2 && mod.GetObjId(team) === mod.GetObjId(t2)) {
                vehicleTeamCacheByVehicleId.set(vId, 2);
                return 2;
            }
            return 0;
        } catch (_e) {
            return 0;
        }
    }
    function getVehicleTeamIdSafe(v: mod.Vehicle): number {
        const vId = safeGetVehicleObjId(v);
        if (vId <= 0) return 0;
        try {
            const team = mod.GetVehicleTeam(v);
            if (!team) return 0;
            const t1 = mod.GetTeam(1);
            const t2 = mod.GetTeam(2);
            if (t1 && mod.GetObjId(team) === mod.GetObjId(t1)) {
                vehicleTeamCacheByVehicleId.set(vId, 1);
                return 1;
            }
            if (t2 && mod.GetObjId(team) === mod.GetObjId(t2)) {
                vehicleTeamCacheByVehicleId.set(vId, 2);
                return 2;
            }
            return 0;
        } catch (_e) {
            return 0;
        }
    }
    function getNearbyBotsOnFoot(teamId: number, position: mod.Vector, maxDist: number): mod.Player[] {
        const result: mod.Player[] = [];
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return result;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!p) continue;
                if (!isAISoldier(p)) continue;
                if (!hasSoldier(p)) continue; // Must have spawned soldier before vehicle check
                if (!isAlive(p)) continue;
                const pTeam = getPlayerTeamId(p);
                if (pTeam !== teamId) continue;
                try {
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (inVehicle) continue; // Already in a vehicle
                } catch (_e) {
                }
                const pPos = getSoldierPos(p);
                if (!pPos) continue;
                const dist = distance3D(pPos, position);
                if (dist <= maxDist) {
                    result.push(p);
                }
            }
        } catch (_e) {
        }
        return result;
    }
    function resolveTeamIdFromSpawner(position: mod.Vector | null, maxDistance: number): number {
        if (!position) return 0;
        let bestTeam = 0;
        let bestDist = 1e30;
        for (const entry of vehicleSpawnerPositionsByTeam) {
            const dist = distance3D(position, entry.pos);
            if (dist < bestDist) {
                bestDist = dist;
                bestTeam = entry.teamId;
            }
        }
        if (bestDist <= maxDistance) return bestTeam;
        return 0;
    }
    function trySeatBot(bot: mod.Player, vehicle: mod.Vehicle, seatIndex: number): boolean {
        const vId = safeGetVehicleObjId(vehicle);
        if (vId <= 0) return false;
        let seatOccupiedBefore = false;
        try {
            seatOccupiedBefore = mod.IsVehicleSeatOccupied(vehicle, seatIndex);
        } catch (_e) {
            seatOccupiedBefore = false;
        }
        maybeTeleportBotNearVehicle(bot, vehicle);
        const ok = safeForcePlayerToSeat(bot, vehicle, seatIndex);
        if (!ok) {
            logSeatDebug(vehicle, seatIndex, bot, false, "ForceFail", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, false));
            return false;
        }
        const seatedVehicle = safeGetVehicleFromPlayer(bot);
        if (!seatedVehicle) {
            const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
            logSeatDebug(vehicle, seatIndex, bot, false, "NoSeatedVehicle", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
            return false;
        }
        try {
            if (mod.GetObjId(seatedVehicle) !== mod.GetObjId(vehicle)) {
                const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
                logSeatDebug(vehicle, seatIndex, bot, false, "Mismatch", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
                return false;
            }
        } catch (_e) {
            const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
            logSeatDebug(vehicle, seatIndex, bot, false, "ObjIdError", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
            return false;
        }
        const seatOccupiedAfter = safeIsVehicleSeatOccupied(vehicle, seatIndex);
        logSeatDebug(vehicle, seatIndex, bot, true, "Seated", buildSeatDebugDetail(vehicle, bot, seatIndex, seatOccupiedBefore, seatOccupiedAfter));
        return true;
    }
    function trySeatBotQuick(bot: mod.Player, vehicle: mod.Vehicle, seatIndex: number): boolean {
        try {
            mod.ForcePlayerToSeat(bot, vehicle, seatIndex);
            return true;
        } catch (_e) {
            return false;
        }
    }
    function logSeatDebug(
        vehicle: mod.Vehicle,
        seatIndex: number,
        bot: mod.Player,
        ok: boolean,
        reason: string,
        detail: string = ""
    ): void {
        if (!ENABLE_VEHICLE_SEAT_DEBUG) return;
        let vId = -1;
        let bId = -1;
        try {
            vId = mod.GetObjId(vehicle);
        } catch (_e) {
        }
        if (vId <= 0) return;
        try {
            bId = mod.GetObjId(bot);
        } catch (_e) {
        }
        const t = mod.GetMatchTimeElapsed();
        const last = lastSeatDebugByVehicleId.get(vId) ?? -9999;
        if (t - last < VEHICLE_SEAT_DEBUG_INTERVAL_SECONDS) return;
        lastSeatDebugByVehicleId.set(vId, t);
        const extra = detail ? ` ${detail}` : "";
        console.log(`[VehicleSeatDebug] v=${vId} seat=${seatIndex} bot=${bId} ok=${ok} reason=${reason}${extra}`);
    }
    function safeIsVehicleSeatOccupied(vehicle: mod.Vehicle, seatIndex: number): boolean {
        try {
            return mod.IsVehicleSeatOccupied(vehicle, seatIndex);
        } catch (_e) {
            return false;
        }
    }
    function buildSeatDebugDetail(
        vehicle: mod.Vehicle,
        bot: mod.Player,
        seatIndex: number,
        seatOccupiedBefore: boolean,
        seatOccupiedAfter: boolean
    ): string {
        const vType = getVehicleTypeLabel(vehicle);
        const vTeam = getVehicleTeamIdSafe(vehicle);
        const bTeam = getPlayerTeamIdSafe(bot);
        const botAlive = isAlive(bot);
        const botInVehicle = isInVehicleSafe(bot);
        const dist = getDistanceBotToVehicle(bot, vehicle);
        return `type=${vType} vTeam=${vTeam} bTeam=${bTeam} seatOccBefore=${seatOccupiedBefore} seatOccAfter=${seatOccupiedAfter} botAlive=${botAlive} botInVeh=${botInVehicle} dist=${dist.toFixed(1)}`;
    }
    function getVehicleTypeLabel(v: mod.Vehicle): string {
        try {
            if (mod.CompareVehicleName(v, mod.VehicleList.Abrams) || mod.CompareVehicleName(v, mod.VehicleList.Leopard)) return "Tank";
            if (mod.CompareVehicleName(v, mod.VehicleList.Vector) || mod.CompareVehicleName(v, mod.VehicleList.CV90)) return "IFV";
            if (mod.CompareVehicleName(v, mod.VehicleList.Cheetah) || mod.CompareVehicleName(v, mod.VehicleList.Gepard)) return "AA";
            if (mod.CompareVehicleName(v, mod.VehicleList.Flyer60) || mod.CompareVehicleName(v, mod.VehicleList.Marauder)) return "Flyer";
            if (mod.CompareVehicleName(v, mod.VehicleList.UH60) || mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax)) return "UH60";
            if (mod.CompareVehicleName(v, mod.VehicleList.AH64) || mod.CompareVehicleName(v, mod.VehicleList.Eurocopter)) return "Heli";
            if (mod.CompareVehicleName(v, mod.VehicleList.F16) || mod.CompareVehicleName(v, mod.VehicleList.F22) || mod.CompareVehicleName(v, mod.VehicleList.JAS39) || mod.CompareVehicleName(v, mod.VehicleList.SU57)) return "Jet";
        } catch (_e) {
        }
        return "Other";
    }
    function getPlayerTeamIdSafe(p: mod.Player): number {
        try {
            const team = mod.GetTeam(p);
            if (!team) return 0;
            const t1 = mod.GetTeam(1);
            const t2 = mod.GetTeam(2);
            if (t1 && mod.GetObjId(team) === mod.GetObjId(t1)) return 1;
            if (t2 && mod.GetObjId(team) === mod.GetObjId(t2)) return 2;
            return 0;
        } catch (_e) {
            return 0;
        }
    }
    function isInVehicleSafe(p: mod.Player): boolean {
        try {
            return mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
        } catch (_e) {
            return false;
        }
    }
    function getDistanceBotToVehicle(bot: mod.Player, vehicle: mod.Vehicle): number {
        const bPos = getSoldierPos(bot);
        const vPos = getVehiclePos(vehicle);
        if (!bPos || !vPos) return 99999;
        return distance3D(bPos, vPos);
    }
    function maybeTeleportBotNearVehicle(bot: mod.Player, vehicle: mod.Vehicle): void {
        if (!ENABLE_SEAT_TELEPORT_ASSIST) return;
        const vPos = getVehiclePos(vehicle);
        const bPos = getSoldierPos(bot);
        if (!vPos || !bPos) return;
        const dist = distance3D(bPos, vPos);
        if (dist <= 8.0) return;
        if (dist > SEAT_TELEPORT_MAX_DISTANCE_METERS) return;
        const x = mod.XComponentOf(vPos) + SEAT_TELEPORT_OFFSET_METERS;
        const y = mod.YComponentOf(vPos);
        const z = mod.ZComponentOf(vPos) + SEAT_TELEPORT_OFFSET_METERS;
        const dst = createPos(x, y, z);
        safeCall("SeatTeleport", () => mod.Teleport(bot, dst, 0));
    }
    function teleportBotNearPosition(bot: mod.Player, pos: mod.Vector, context: string): void {
        if (!ENABLE_SEAT_TELEPORT_ASSIST) return;
        const x = mod.XComponentOf(pos) + SEAT_TELEPORT_OFFSET_METERS;
        const y = mod.YComponentOf(pos);
        const z = mod.ZComponentOf(pos) + SEAT_TELEPORT_OFFSET_METERS;
        const dst = createPos(x, y, z);
        safeCall(`SeatTeleport:${context}`, () => mod.Teleport(bot, dst, 0));
    }
    function findNearestVehicleNear(position: mod.Vector, maxDist: number): mod.Vehicle | null {
        let best: mod.Vehicle | null = null;
        let bestDist = maxDist;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const dist = distance3D(position, vPos);
                if (dist <= bestDist) {
                    bestDist = dist;
                    best = v;
                }
            }
        } catch (_e) {
        }
        return best;
    }
    function getSpawnerTeamId(spawnerId: number): number {
        if (TEAM1_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) return 1;
        if (TEAM2_GROUND_VEHICLE_SPAWNER_IDS.includes(spawnerId)) return 2;
        if (TEAM1_SKY_JET_SPAWNERS.includes(spawnerId)) return 1;
        if (TEAM2_SKY_JET_SPAWNERS.includes(spawnerId)) return 2;
        return 0;
    }
    function isVehicleAutoSeatingWindowOpen(): boolean {
        return mod.GetMatchTimeElapsed() <= VEHICLE_AUTO_SEATING_WINDOW_SECONDS;
    }
    export function tickVehicleDirector(): void {
        ensureVehicleInit();
        if (mod.GetMatchTimeElapsed() < VEHICLE_DIRECTOR_START_DELAY_SECONDS) return;
        safeCall("VehicleDirector:GroundSeatSweep", () => tickGroundVehicleSeatSweep());
        safeCall("VehicleDirector:GroundSpawnerSpawn", () => runGroundSpawnerAutoSpawnOnce());
        safeCall("VehicleDirector:GroundInitSweep", () => tickGroundVehicleInitSweep());
        safeCall("VehicleDirector:SpawnerInitSweep", () => tickSpawnerInitSweep());
        safeCall("VehicleDirector:VerifySpawners", () => verifySpawnerSettings());
        safeCall("VehicleDirector:SkyJets", () => tickSkyJets());
        if (!ENABLE_VEHICLE_SEAT_FILLING) return;
        if (!isVehicleAutoSeatingWindowOpen()) return;
        const t = now(true);
        if (t - lastVehicleCheckTime < VEHICLE_CHECK_INTERVAL_SECONDS) return;
        lastVehicleCheckTime = t;
        for (const [vId, lastTime] of recentlyProcessedVehicles.entries()) {
            if (t - lastTime > VEHICLE_COOLDOWN_SECONDS) {
                recentlyProcessedVehicles.delete(vId);
            }
        }
        if (lastSeatDebugByVehicleId.size > 100) {
            try {
                const allVeh = mod.AllVehicles();
                const activeVehIds = new Set<number>();
                if (allVeh) {
                    const vc = mod.CountOf(allVeh);
                    for (let vi = 0; vi < vc; vi++) {
                        const vv = mod.ValueInArray(allVeh, vi) as mod.Vehicle;
                        if (vv) try { activeVehIds.add(mod.GetObjId(vv)); } catch (_) {}
                    }
                }
                for (const vid of lastSeatDebugByVehicleId.keys()) {
                    if (!activeVehIds.has(vid)) lastSeatDebugByVehicleId.delete(vid);
                }
                for (const vid of vehicleTeamCacheByVehicleId.keys()) {
                    if (!activeVehIds.has(vid)) vehicleTeamCacheByVehicleId.delete(vid);
                }
            } catch (_) {}
        }
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                const vId = mod.GetObjId(v);
                if (recentlyProcessedVehicles.has(vId)) continue;
                let occupied = false;
                try {
                    occupied = mod.IsVehicleOccupied(v);
                } catch (_e) {
                    occupied = false;
                }
                if (!occupied) continue;
                if (isHelicopter(v)) continue;
                const teamId = getVehicleTeamId(v);
                if (teamId !== 1 && teamId !== 2) continue;
                try {
                    if (mod.IsVehicleSeatOccupied(v, 0)) {
                        const driver = mod.GetPlayerFromVehicleSeat(v, 0);
                        if (driver && !isAISoldier(driver)) {
                            continue;
                        }
                    }
                } catch (_e) {
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const hqPos = getHQPositionForTeam(teamId);
                if (hqPos) {
                    const distToHQ = mod.DistanceBetween(vPos, hqPos);
                    if (distToHQ > 150.0) continue;
                }
                const nearbyBots = getNearbyBotsOnFoot(teamId, vPos, VEHICLE_SEAT_FILL_RANGE_METERS);
                if (nearbyBots.length === 0) continue;
                recentlyProcessedVehicles.set(vId, t);
                let seatedCount = 0;
                const maxSeatsToTry = Math.min(3, nearbyBots.length);
                for (let seat = 1; seat <= 3 && seatedCount < maxSeatsToTry; seat++) {
                    const bot = nearbyBots[seatedCount];
                    if (trySeatBot(bot, v, seat)) {
                        safeCall("VehicleDirector:GunnerSeat:Behavior", () => mod.AIBattlefieldBehavior(bot));
                        safeCall("VehicleDirector:GunnerSeat:EnableTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("VehicleDirector:GunnerSeat:EnableShooting", () => mod.AIEnableShooting(bot, true));
                        seatedCount++;
                        log(`[VehicleDirector] Seated bot in vehicle ${vId} seat ${seat}`);
                    }
                }
            }
        } catch (_e) {
        }
    }
    let lastHeliCrewCheckTime = -9999;
    const HELI_CREW_CHECK_INTERVAL = 5.0; // seconds
    const HELI_CREW_HQ_RANGE = 150.0; // only manage helis near HQ
    const HELI_CREW_BOT_SEARCH_RANGE = 30.0; // grab nearby bots on foot
    const ATTACK_HELI_CREW_START_DELAY_SECONDS = 45.0;
    const helisWaitingForCrew = new Map<number, { pilotId: number; crewNeeded: number }>();
    function getRequiredGunnerCount(v: mod.Vehicle): number {
        try {
            if (mod.CompareVehicleName(v, mod.VehicleList.UH60) || mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax)) return 2;
            if (mod.CompareVehicleName(v, mod.VehicleList.AH64)) return 1;
            if (mod.CompareVehicleName(v, mod.VehicleList.AH6M)) return 1;
            if (mod.CompareVehicleName(v, mod.VehicleList.Eurocopter)) return 1;
        } catch (_e) {
        }
        return 0;
    }
    function isHelicopter(v: mod.Vehicle): boolean {
        try {
            return mod.CompareVehicleName(v, mod.VehicleList.UH60) ||
                   mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax) ||
                   mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                   mod.CompareVehicleName(v, mod.VehicleList.AH6M) ||
                   mod.CompareVehicleName(v, mod.VehicleList.Eurocopter);
        } catch (_e) {
            return false;
        }
    }
    function isPlayerClaimAttackHelicopter(v: mod.Vehicle): boolean {
        try {
            return mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                   mod.CompareVehicleName(v, mod.VehicleList.AH6M) ||
                   mod.CompareVehicleName(v, mod.VehicleList.Eurocopter);
        } catch (_e) {
            return false;
        }
    }
    function tickHeliCrewUp(): void {
        if (!isVehicleAutoSeatingWindowOpen()) return;
        const t = now(true);
        if (t - lastHeliCrewCheckTime < HELI_CREW_CHECK_INTERVAL) return;
        lastHeliCrewCheckTime = t;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                if (!isHelicopter(v)) continue;
                if (isPlayerClaimAttackHelicopter(v)) {
                    try { helisWaitingForCrew.delete(mod.GetObjId(v)); } catch (_e) {}
                    continue;
                }
                if (isPlayerClaimAttackHelicopter(v) && mod.GetMatchTimeElapsed() < ATTACK_HELI_CREW_START_DELAY_SECONDS) {
                    try { helisWaitingForCrew.delete(mod.GetObjId(v)); } catch (_e) {}
                    continue;
                }
                if (vehicleUI_IsVehicleReservedForHuman(v)) continue;
                const vId = mod.GetObjId(v);
                if (vId <= 0) continue;
                let occupied = false;
                try { occupied = mod.IsVehicleOccupied(v); } catch (_e) { continue; }
                if (!occupied) {
                    helisWaitingForCrew.delete(vId);
                    const emptyTeamId = getVehicleTeamId(v);
                    if (emptyTeamId === 1 || emptyTeamId === 2) {
                        const emptyVPos = getVehiclePos(v);
                        if (emptyVPos) {
                            const emptyHqPos = getHQPositionForTeam(emptyTeamId);
                            if (emptyHqPos && mod.DistanceBetween(emptyVPos, emptyHqPos) <= HELI_CREW_HQ_RANGE) {
                                const pilotCandidates = getNearbyBotsOnFoot(emptyTeamId, emptyVPos, HELI_CREW_BOT_SEARCH_RANGE);
                                if (pilotCandidates.length > 0) {
                                    const pilotBot = pilotCandidates[0];
                                    if (trySeatBot(pilotBot, v, 0)) {
                                        const reqGunners = getRequiredGunnerCount(v);
                                        helisWaitingForCrew.set(vId, { pilotId: mod.GetObjId(pilotBot), crewNeeded: reqGunners });
                                        log(`[HeliCrew] Seated AI pilot in empty heli ${vId} (need ${reqGunners} gunners)`);
                                    }
                                }
                            }
                        }
                    }
                    continue;
                }
                const teamId = getVehicleTeamId(v);
                if (teamId !== 1 && teamId !== 2) continue;
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                const hqPos = getHQPositionForTeam(teamId);
                if (hqPos) {
                    const distToHQ = mod.DistanceBetween(vPos, hqPos);
                    if (distToHQ > HELI_CREW_HQ_RANGE) {
                        helisWaitingForCrew.delete(vId);
                        continue;
                    }
                }
                let pilotIsHuman = false;
                try {
                    if (mod.IsVehicleSeatOccupied(v, 0)) {
                        const pilot = mod.GetPlayerFromVehicleSeat(v, 0);
                        if (pilot && !isAISoldier(pilot)) {
                            pilotIsHuman = true;
                        }
                    }
                } catch (_e) {
                }
                if (pilotIsHuman) continue;
                const requiredGunners = getRequiredGunnerCount(v);
                if (requiredGunners <= 0) continue;
                let currentGunners = 0;
                for (let seat = 1; seat <= requiredGunners; seat++) {
                    try {
                        if (mod.IsVehicleSeatOccupied(v, seat)) {
                            currentGunners++;
                        }
                    } catch (_e) {
                    }
                }
                if (currentGunners >= requiredGunners) {
                    if (helisWaitingForCrew.has(vId)) {
                        helisWaitingForCrew.delete(vId);
                        try {
                            if (mod.IsVehicleSeatOccupied(v, 0)) {
                                const pilot = mod.GetPlayerFromVehicleSeat(v, 0);
                                if (pilot && isAISoldier(pilot)) {
                                    mod.AIBattlefieldBehavior(pilot);
                                    log(`[HeliCrew] Crew complete for heli ${vId} - releasing pilot`);
                                }
                            }
                        } catch (_e) {
                        }
                        for (let seat = 1; seat <= requiredGunners; seat++) {
                            try {
                                if (mod.IsVehicleSeatOccupied(v, seat)) {
                                    const gunner = mod.GetPlayerFromVehicleSeat(v, seat);
                                    if (gunner) {
                                        log(`[HeliCrew] Gunner seat ${seat} occupied for heli ${vId}`);
                                    }
                                }
                            } catch (_e) {
                            }
                        }
                    }
                    continue;
                }
                let pilotId = 0;
                try {
                    if (mod.IsVehicleSeatOccupied(v, 0)) {
                        const pilot = mod.GetPlayerFromVehicleSeat(v, 0);
                        if (pilot) pilotId = mod.GetObjId(pilot);
                    }
                } catch (_e) {
                }
                helisWaitingForCrew.set(vId, { pilotId, crewNeeded: requiredGunners - currentGunners });
                const nearbyBots = getNearbyBotsOnFoot(teamId, vPos, HELI_CREW_BOT_SEARCH_RANGE);
                if (nearbyBots.length === 0) continue;
                let seatedThisTick = 0;
                for (let seat = 1; seat <= requiredGunners && seatedThisTick < nearbyBots.length; seat++) {
                    let seatTaken = false;
                    try { seatTaken = mod.IsVehicleSeatOccupied(v, seat); } catch (_e) { continue; }
                    if (seatTaken) continue;
                    const bot = nearbyBots[seatedThisTick];
                    if (trySeatBot(bot, v, seat)) {
                        safeCall("HeliCrew:GunnerTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("HeliCrew:GunnerShooting", () => mod.AIEnableShooting(bot, true));
                        seatedThisTick++;
                        log(`[HeliCrew] Seated gunner in heli ${vId} seat ${seat}`);
                    }
                }
            }
        } catch (_e) {
        }
    }
    let lastGroundSweepTime = -9999;
    const GROUND_SWEEP_INTERVAL = 30.0; // seconds - matches vehicle respawn timer
    const GROUND_SWEEP_START_DELAY = 15.0; // wait for bots to spawn first
    const GROUND_SWEEP_MAX_PER_TICK = 3; // max vehicles per sweep to avoid lag
    function tickGroundVehicleSeatSweep(): void {
        if (!ENABLE_VEHICLE_SEAT_FILLING) return;
        if (!isVehicleAutoSeatingWindowOpen()) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow < GROUND_SWEEP_START_DELAY) return;
        if (timeNow - lastGroundSweepTime < GROUND_SWEEP_INTERVAL) return;
        lastGroundSweepTime = timeNow;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            let occupiedGround = 0;
            let emptyGround = 0;
            let seatedThisSweep = 0;
            const emptyNames: string[] = [];
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                if (vehicleUI_IsVehicleReservedForHuman(v)) continue;
                let isAircraft = false;
                try {
                    isAircraft =
                        mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                        mod.CompareVehicleName(v, mod.VehicleList.AH6M) ||
                        mod.CompareVehicleName(v, mod.VehicleList.Eurocopter) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F22) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F16) ||
                        mod.CompareVehicleName(v, mod.VehicleList.JAS39) ||
                        mod.CompareVehicleName(v, mod.VehicleList.SU57);
                } catch (_e) {
                    isAircraft = true;
                }
                if (isAircraft) continue;
                let isOccupied = false;
                try {
                    isOccupied = mod.IsVehicleOccupied(v);
                } catch (_e) {
                    isOccupied = true;
                }
                if (isOccupied) {
                    occupiedGround++;
                    continue;
                }
                emptyGround++;
                let name = "?";
                try {
                    if (mod.CompareVehicleName(v, mod.VehicleList.Abrams)) name = "Abrams";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Leopard)) name = "Leopard";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.M2Bradley)) name = "M2Bradley";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.CV90)) name = "CV90";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Cheetah)) name = "Cheetah";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Gepard)) name = "Gepard";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Marauder)) name = "Marauder";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Marauder_Pax)) name = "Marauder_Pax";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Vector)) name = "Vector";
                    else if (mod.CompareVehicleName(v, mod.VehicleList.Flyer60)) name = "Flyer60";
                } catch (_e) {}
                let teamStr = "?";
                try {
                    const team = mod.GetVehicleTeam(v);
                    if (!team) teamStr = "null";
                    else if (mod.GetObjId(team) === mod.GetObjId(mod.GetTeam(1))) teamStr = "T1";
                    else if (mod.GetObjId(team) === mod.GetObjId(mod.GetTeam(2))) teamStr = "T2";
                    else teamStr = "neutral";
                } catch (_e) { teamStr = "err"; }
                if (seatedThisSweep >= GROUND_SWEEP_MAX_PER_TICK) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                const vPos = getVehiclePos(v);
                if (!vPos) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                let vTeamId = 0;
                try {
                    const team = mod.GetVehicleTeam(v);
                    if (team) {
                        if (mod.GetObjId(team) === mod.GetObjId(mod.GetTeam(1))) vTeamId = 1;
                        else if (mod.GetObjId(team) === mod.GetObjId(mod.GetTeam(2))) vTeamId = 2;
                    }
                } catch (_e) {}
                if (vTeamId > 0) {
                    const hqPos = getHQPositionForTeam(vTeamId);
                    if (hqPos) {
                        const dist = mod.DistanceBetween(vPos, hqPos);
                        if (dist > 150.0) {
                            emptyNames.push(`${name}(${teamStr}:far)`);
                            continue;
                        }
                    }
                }
                const bot = pickNearestBotOnFootToPosition(vPos, VEHICLE_SEAT_FILL_RANGE_METERS);
                if (!bot) {
                    emptyNames.push(`${name}(${teamStr})`);
                    continue;
                }
                try { mod.ForcePlayerToSeat(bot, v, -1); } catch (_e) {}
                try { mod.ForcePlayerToSeat(bot, v, 0); } catch (_e) {}
                safeCall("GroundSweep:Behavior", () => mod.AIBattlefieldBehavior(bot));
                safeCall("GroundSweep:Targeting", () => mod.AIEnableTargeting(bot, true));
                safeCall("GroundSweep:Shooting", () => mod.AIEnableShooting(bot, true));
                const isTank = (name === "Abrams" || name === "Leopard");
                const isIFV = (name === "Bradley" || name === "M2Bradley" || name === "CV90");
                const isAA = (name === "AA" || name === "Cheetah" || name === "Gepard");
                const isMarauder = (name === "Marauder" || name === "Marauder_Pax");
                if (isTank) {
                    try { mod.SetVehicleMaxHealthMultiplier(v, TANK_HEALTH_MULTIPLIER); } catch (_e) {}
                } else if (isIFV) {
                    try { mod.SetVehicleMaxHealthMultiplier(v, IFV_HEALTH_MULTIPLIER); } catch (_e) {}
                } else if (isAA) {
                    try { mod.SetVehicleMaxHealthMultiplier(v, AA_HEALTH_MULTIPLIER); } catch (_e) {}
                } else if (isMarauder) {
                    try { mod.SetVehicleMaxHealthMultiplier(v, MARAUDER_HEALTH_MULTIPLIER); } catch (_e) {}
                }
                const healthTag = isTank ? ` [hp=${TANK_HEALTH_MULTIPLIER}x]` : isIFV ? ` [hp=${IFV_HEALTH_MULTIPLIER}x]` : isAA ? ` [hp=${AA_HEALTH_MULTIPLIER}x]` : isMarauder ? ` [hp=${MARAUDER_HEALTH_MULTIPLIER}x]` : "";
                seatedThisSweep++;
                log(`[VehicleDirector] Seated bot in ${name}(${teamStr})${healthTag}`);
            }
            if (emptyGround > 0 || seatedThisSweep > 0) {
                log(`[VehicleDirector] Status: ${occupiedGround} occupied, ${emptyGround} empty, ${seatedThisSweep} seated`);
                if (emptyNames.length > 0) {
                    log(`[VehicleDirector] Still empty: ${emptyNames.join(", ")}`);
                }
            }
        } catch (_e) {
        }
    }
    function tickGroundVehicleInitSweep(): void {
        if (!ENABLE_GROUND_VEHICLE_INIT_SWEEP) return;
        if (!isVehicleAutoSeatingWindowOpen()) return;
        const t = now(true);
        if (t - lastGroundInitSweepTime < GROUND_VEHICLE_INIT_INTERVAL_SECONDS) return;
        lastGroundInitSweepTime = t;
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            if (count <= 0) return;
            for (let i = 0; i < count; i++) {
                const v = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!v) continue;
                let isAircraft = false;
                try {
                    isAircraft =
                        mod.CompareVehicleName(v, mod.VehicleList.AH64) ||
                        mod.CompareVehicleName(v, mod.VehicleList.AH6M) ||
                        mod.CompareVehicleName(v, mod.VehicleList.Eurocopter) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60) ||
                        mod.CompareVehicleName(v, mod.VehicleList.UH60_Pax) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F22) ||
                        mod.CompareVehicleName(v, mod.VehicleList.F16) ||
                        mod.CompareVehicleName(v, mod.VehicleList.JAS39) ||
                        mod.CompareVehicleName(v, mod.VehicleList.SU57);
                } catch (_e) {
                    isAircraft = true;
                }
                if (isAircraft) continue;
                const vPos = getVehiclePos(v);
                if (!vPos) continue;
                if (!isPositionNearVehicleSpawner(vPos, 60.0)) continue;
                const teamId = resolveTeamIdFromSpawner(vPos, 120.0);
                if (teamId !== 1 && teamId !== 2) continue;
                const hqPos = getHQPositionForTeam(teamId);
                if (hqPos && mod.DistanceBetween(vPos, hqPos) > 150.0) continue;
                let driverOccupied = false;
                try {
                    driverOccupied = mod.IsVehicleSeatOccupied(v, 0);
                } catch (_e) {
                    driverOccupied = true;
                }
                if (driverOccupied) continue;
                const nearBotsInit = getNearbyBotsOnFoot(teamId, vPos, 50.0);
                const bot = nearBotsInit.length > 0 ? nearBotsInit[0] : null;
                if (!bot) continue;
                teleportBotNearPosition(bot, vPos, "GroundInit");
                if (trySeatBot(bot, v, 0)) {
                    if (ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR) {
                        safeCall("VehicleDirector:InitBehavior", () => mod.AIBattlefieldBehavior(bot));
                        safeCall("VehicleDirector:InitTargeting", () => mod.AIEnableTargeting(bot, true));
                        safeCall("VehicleDirector:InitShooting", () => mod.AIEnableShooting(bot, true));
                    }
                    const vehicleCopy = v;
                    const botCopy = bot;
                    void (async () => {
                        await mod.Wait(0.25);
                        safeCall("VehicleDirector:InitExitPlayerVehicle", () => mod.ForcePlayerExitVehicle(botCopy, vehicleCopy));
                        safeCall("VehicleDirector:InitExitPlayer", () => mod.ForcePlayerExitVehicle(botCopy));
                        safeCall("VehicleDirector:InitExitVehicle", () => mod.ForcePlayerExitVehicle(vehicleCopy));
                    })();
                }
            }
        } catch (_e) {
        }
    }
    function tickSpawnerInitSweep(): void {
        if (!ENABLE_SPAWNER_INIT_SWEEP) return;
        if (!isVehicleAutoSeatingWindowOpen()) return;
        const t = now(true);
        if (t - lastSpawnerInitSweepTime < SPAWNER_INIT_INTERVAL_SECONDS) return;
        lastSpawnerInitSweepTime = t;
        const tryInitSpawner = (spawnerId: number, isJet: boolean): void => {
            let spawner: mod.VehicleSpawner | null = null;
            try {
                spawner = mod.GetVehicleSpawner(spawnerId);
            } catch (_e) {
                spawner = null;
            }
            if (!spawner) return;
            const spawnerPos = getObjectPos(spawner as unknown as mod.Object);
            if (!spawnerPos) return;
            const near = findNearestVehicleNear(spawnerPos, SPAWNER_INIT_NEAR_DISTANCE_METERS);
            if (!near) {
                safeCall(`SpawnerInit:Spawn:${spawnerId}`, () => mod.ForceVehicleSpawnerSpawn(spawner as mod.VehicleSpawner));
            }
            const vehicle = near ?? findNearestVehicleNear(spawnerPos, SPAWNER_INIT_NEAR_DISTANCE_METERS);
            if (!vehicle) return;
            if (isHelicopter(vehicle)) return;
            const teamId = getSpawnerTeamId(spawnerId);
            if (teamId !== 1 && teamId !== 2) return;
            const hqPos = getHQPositionForTeam(teamId);
            if (hqPos && mod.DistanceBetween(spawnerPos, hqPos) > 150.0) return;
            const nearBotsSpawner = getNearbyBotsOnFoot(teamId, spawnerPos, 50.0);
            const bot = nearBotsSpawner.length > 0 ? nearBotsSpawner[0] : null;
            if (!bot) return;
            teleportBotNearPosition(bot, spawnerPos, isJet ? "SpawnerJetInit" : "SpawnerGroundInit");
            if (trySeatBot(bot, vehicle, 0)) {
                if (ENABLE_VEHICLE_UNLOCK_APPLY_BEHAVIOR) {
                    safeCall("VehicleDirector:SpawnerInitBehavior", () => mod.AIBattlefieldBehavior(bot));
                    safeCall("VehicleDirector:SpawnerInitTargeting", () => mod.AIEnableTargeting(bot, true));
                    safeCall("VehicleDirector:SpawnerInitShooting", () => mod.AIEnableShooting(bot, true));
                }
                const vehicleCopy = vehicle;
                const botCopy = bot;
                void (async () => {
                    await mod.Wait(0.25);
                    safeCall("VehicleDirector:SpawnerInitExitPlayerVehicle", () => mod.ForcePlayerExitVehicle(botCopy, vehicleCopy));
                    safeCall("VehicleDirector:SpawnerInitExitPlayer", () => mod.ForcePlayerExitVehicle(botCopy));
                    safeCall("VehicleDirector:SpawnerInitExitVehicle", () => mod.ForcePlayerExitVehicle(vehicleCopy));
                })();
            }
        };
        for (const spawnerId of GROUND_VEHICLE_SPAWNER_IDS) {
            tryInitSpawner(spawnerId, false);
        }
    }
    function runGroundSpawnerAutoSpawnOnce(): void {
        if (!ENABLE_SCRIPTED_GROUND_SPAWN) return;
        if (groundSpawnerSpawnDone) return;
        const timeNow = mod.GetMatchTimeElapsed();
        if (timeNow < GROUND_SPAWN_DELAY_SECONDS) return;
        groundSpawnerSpawnDone = true;
        for (const spawnerId of GROUND_VEHICLE_SPAWNER_IDS) {
            try {
                const spawner = mod.GetVehicleSpawner(spawnerId);
                if (!spawner) continue;
                if (ENABLE_GROUND_AUTOSPAWN_AFTER_DELAY) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, true);
                }
                mod.ForceVehicleSpawnerSpawn(spawner);
            } catch (_e) {
            }
        }
    }
    function isVehicleEmpty(vehicle: mod.Vehicle): boolean {
        try {
            return !mod.IsVehicleOccupied(vehicle);
        } catch (_e) {
            return false;
        }
    }
    export function forceDestroyEmptyVehicle(vehicleType: mod.VehicleList, label: string): boolean {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return false;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                let isRightType = false;
                try {
                    isRightType = mod.CompareVehicleName(vehicle, vehicleType);
                } catch (_e) {
                    continue;
                }
                if (!isRightType) continue;
                if (isVehicleEmpty(vehicle)) {
                    const vehicleId = mod.GetObjId(vehicle);
                    log(`[VehicleDirector] Force destroying empty ${label} (${vehicleId}) due to spawn UI failure`);
                    try {
                        mod.DealDamage(vehicle, 99999);
                        return true;
                    } catch (e) {
                        log(`[VehicleDirector] Failed to force destroy: ${e}`);
                    }
                }
            }
        } catch (_e) {}
        return false;
    }
}


// Module: modules/VehicleSpawnUIModule.ts
namespace ConquestV8 {
    let vehicleUIInitialized = false;
    const playerPanels: Map<number, UI.UIContainer> = new Map();
    const playerButtons: Map<number, Map<number, UI.UITextButton>> = new Map();
    const playerButtonStateSetters: Map<number, Map<number, SolidUI.Setter<ButtonVisualState>>> = new Map();
    const playerPanelDisposers: Map<number, () => void> = new Map();
    const playerUIVisible: Set<number> = new Set();
    interface ButtonVisualState {
        enabled: boolean;
        baseColor: mod.Vector;
    }
    const suppressUIUntilByPlayerId: Map<number, number> = new Map();
    const pendingDeploySeat: Map<number, { vehicleObjId: number; seatIndex: number; label: string; seatGen: number; claimRequestedPilot: boolean }> = new Map();
    interface PendingSpawnRequest {
        spawnerId: number;
        teamId: number;
        vehicleType: mod.VehicleList;
        matchTypes: mod.VehicleList[];
        label: string;
        seatGen: number;
        time: number;
    }
    const pendingSpawnRequestsByPlayerId: Map<number, PendingSpawnRequest> = new Map();
    const assignedSpawnedVehicleIdByPlayerId: Map<number, number> = new Map();
    const MAX_SPAWN_ASSIGN_SECONDS = 8.0;
    const ATTACK_HELI_SPAWN_WAIT_SECONDS = 45.0;
    const playerSeatGeneration: Map<number, number> = new Map();
    let lastButtonClickTime = 0;
    const BUTTON_DEBOUNCE_SECONDS = 1.0;
    const TEAM1_HQ_SPAWN_POINTS = [1009, 1010, 1012, 1013];
    const TEAM2_HQ_SPAWN_POINTS = [1014, 1015, 1016, 1017];
    const UI_PANEL_X = 1990;
    const UI_PANEL_Y = 280;
    const BUTTON_SIZE = 55;
    const BUTTON_GAP = 8;
    const ROW_HEIGHT = 65;
    const BUTTONS_PER_ROW = 3;
    type VehicleCategory = 'Ground' | 'Air';
    interface VehicleDef {
        type: mod.VehicleList;
        label: string;
        spawnerId: number;
        category: VehicleCategory;
        matchTypes?: mod.VehicleList[];
    }
    interface MapVehicleConfig {
        team1: VehicleDef[];
        team2: VehicleDef[];
    }
    const CAPSTONE_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 207, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 208, category: 'Ground', matchTypes: [mod.VehicleList.Cheetah, mod.VehicleList.Gepard] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 293, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 294, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 295, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 215, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 244, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 239, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 292, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 296, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 247, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 291, category: 'Air' },
        ]
    };
    const EASTWOOD_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 202, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 207, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 208, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 293, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 294, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 295, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 215, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 244, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Cheetah, mod.VehicleList.Gepard] },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 239, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 292, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 296, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 247, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 291, category: 'Air' },
        ]
    };
    const DOWNTOWN_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 204, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.M2Bradley, label: "IFV", spawnerId: 207, category: 'Ground' },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 208, category: 'Ground', matchTypes: [mod.VehicleList.Cheetah, mod.VehicleList.Gepard] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 293, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 294, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 295, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 215, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.CV90, label: "IFV", spawnerId: 244, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 239, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 292, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 296, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 247, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 291, category: 'Air' },
        ]
    };
    const SAND_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 207, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 208, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 293, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 294, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 295, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 215, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 244, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 239, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 292, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 296, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 247, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 291, category: 'Air' },
        ]
    };
    let activeMapConfig: MapVehicleConfig = DOWNTOWN_CONFIG;
    let detectedMapName = 'Unknown';
    const BADLANDS_CONFIG: MapVehicleConfig = {
        team1: [
            { type: mod.VehicleList.Abrams, label: "Abrams", spawnerId: 202, category: 'Ground' },
            { type: mod.VehicleList.M2Bradley, label: "Bradley", spawnerId: 204, category: 'Ground' },
            { type: mod.VehicleList.Marauder, label: "Marauder", spawnerId: 207, category: 'Ground', matchTypes: [mod.VehicleList.Marauder, mod.VehicleList.Marauder_Pax] },
            { type: mod.VehicleList.Cheetah, label: "AA", spawnerId: 208, category: 'Ground', matchTypes: [mod.VehicleList.Cheetah, mod.VehicleList.Gepard] },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 293, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 294, category: 'Ground' },
            { type: mod.VehicleList.Flyer60, label: "Flyer", spawnerId: 295, category: 'Ground' },
            { type: mod.VehicleList.F22, label: "F22", spawnerId: 232, category: 'Air' },
            { type: mod.VehicleList.F16, label: "F16", spawnerId: 243, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 203, category: 'Air' },
            { type: mod.VehicleList.AH64, label: "AH64", spawnerId: 242, category: 'Air' },
            { type: mod.VehicleList.UH60, label: "UH60", spawnerId: 238, category: 'Air' },
        ],
        team2: [
            { type: mod.VehicleList.Leopard, label: "Leopard", spawnerId: 209, category: 'Ground' },
            { type: mod.VehicleList.Marauder_Pax, label: "Marauder", spawnerId: 215, category: 'Ground', matchTypes: [mod.VehicleList.Marauder_Pax, mod.VehicleList.Marauder] },
            { type: mod.VehicleList.CV90, label: "CV90", spawnerId: 244, category: 'Ground' },
            { type: mod.VehicleList.Gepard, label: "AA", spawnerId: 234, category: 'Ground', matchTypes: [mod.VehicleList.Gepard, mod.VehicleList.Cheetah] },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 239, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 292, category: 'Ground' },
            { type: mod.VehicleList.Vector, label: "Vector", spawnerId: 296, category: 'Ground' },
            { type: mod.VehicleList.JAS39, label: "JAS39", spawnerId: 247, category: 'Air' },
            { type: mod.VehicleList.SU57, label: "SU57", spawnerId: 233, category: 'Air' },
            { type: mod.VehicleList.AH6M, label: "AH6M", spawnerId: 211, category: 'Air' },
            { type: mod.VehicleList.Eurocopter, label: "ATK", spawnerId: 241, category: 'Air' },
            { type: mod.VehicleList.UH60_Pax, label: "UH60", spawnerId: 291, category: 'Air' },
        ]
    };
    function getTeam1Vehicles(): VehicleDef[] { return activeMapConfig.team1; }
    function getTeam2Vehicles(): VehicleDef[] { return activeMapConfig.team2; }
    function detectMapAndLoadVehicleConfig(): void {
        try {
            if (mod.IsCurrentMap(mod.Maps.Capstone)) {
                activeMapConfig = CAPSTONE_CONFIG;
                detectedMapName = 'Capstone';
            } else if (mod.IsCurrentMap(mod.Maps.Eastwood)) {
                activeMapConfig = EASTWOOD_CONFIG;
                detectedMapName = 'Eastwood';
            } else if (mod.IsCurrentMap(mod.Maps.Granite_MainStreet)) {
                activeMapConfig = DOWNTOWN_CONFIG;
                detectedMapName = 'Downtown';
            } else if (mod.IsCurrentMap(mod.Maps.Sand)) {
                activeMapConfig = SAND_CONFIG;
                detectedMapName = 'Sand';
            } else if (mod.IsCurrentMap(mod.Maps.Badlands)) {
                activeMapConfig = BADLANDS_CONFIG;
                detectedMapName = 'Badlands';
            } else {
                activeMapConfig = BADLANDS_CONFIG;
                detectedMapName = 'Unknown (using Badlands config)';
            }
            log(`[VehicleUI] Map detected: ${detectedMapName} - loaded ${activeMapConfig.team1.length + activeMapConfig.team2.length} vehicle configs`);
            try {
                const team1 = mod.GetTeam(1);
                if (team1 && !mod.IsFaction(team1, mod.Factions.NATO)) {
                    const swapped: MapVehicleConfig = {
                        team1: activeMapConfig.team2,
                        team2: activeMapConfig.team1
                    };
                    activeMapConfig = swapped;
                    log(`[VehicleUI] Teams swapped sides - flipped vehicle configs (team1 now uses team2 spawners)`);
                }
            } catch (e) {
                log(`[VehicleUI] Faction check failed: ${e} - using default config`);
            }
        } catch (e) {
            log(`[VehicleUI] Map detection failed: ${e} - using Downtown fallback`);
            activeMapConfig = DOWNTOWN_CONFIG;
            detectedMapName = 'Error (using Downtown config)';
        }
    }
    const jetCooldownByPlayerId: Map<number, number> = new Map();
    const JET_COOLDOWN_SECONDS = 40.0;
    const JET_VEHICLE_TYPES: mod.VehicleList[] = [
        mod.VehicleList.F22,
        mod.VehicleList.F16,
        mod.VehicleList.JAS39,
        mod.VehicleList.SU57
    ];
    function isJetVehicle(vehicleType: mod.VehicleList): boolean {
        return JET_VEHICLE_TYPES.includes(vehicleType);
    }
    function isAttackHeliVehicleType(vehicleType: mod.VehicleList): boolean {
        return vehicleType === mod.VehicleList.AH6M ||
               vehicleType === mod.VehicleList.AH64 ||
               vehicleType === mod.VehicleList.Eurocopter;
    }
    function includesAttackHeli(vehicleTypes: mod.VehicleList[]): boolean {
        for (const vehicleType of vehicleTypes) {
            if (isAttackHeliVehicleType(vehicleType)) return true;
        }
        return false;
    }
    function showVehicleRequestNotification(message: string): void {
        try {
            mod.DisplayCustomNotificationMessage(
                mod.Message("{0}", message),
                mod.CustomNotificationSlots.MessageText1,
                1.5
            );
        } catch (_e) {}
    }
    function getJetCooldownRemaining(playerId: number): number {
        const cooldownExpires = jetCooldownByPlayerId.get(playerId);
        if (!cooldownExpires) return 0;
        const remaining = cooldownExpires - mod.GetMatchTimeElapsed();
        return remaining > 0 ? remaining : 0;
    }
    function setJetCooldown(playerId: number): void {
        jetCooldownByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + JET_COOLDOWN_SECONDS);
    }
    type VehicleAvailability = 'empty' | 'has_seats' | 'full' | 'cooldown' | 'no_vehicle';
    interface SpawnerState {
        spawnerId: number;
        vehicleDef: VehicleDef;
        availability: VehicleAvailability;
        vehicleObjId: number | null;       // tracked vehicle (null if destroyed/not spawned)
        cooldownStartTime: number;         // when cooldown began (from OnVehicleDestroyed)
        cooldownDuration: number;          // 30s matches map spawner respawn
        firstEmptySeat: number;            // first free seat index (for spare seat deployment)
        totalSeats: number;                // cached seat count
        occupiedSeats: number;             // how many seats are occupied
    }
    const spawnerStateMap: Map<number, SpawnerState> = new Map();
    const vehicleIdToSpawnerId: Map<number, number> = new Map(); // reverse lookup: vehicleObjId -> spawnerId
    const SPAWNER_COOLDOWN_SECONDS = 30.0;
    let lastUIStatusUpdateTime = 0;
    const UI_STATUS_UPDATE_INTERVAL = 0.5;
    const badVehicleIds: Set<number> = new Set();
    let lastBadVehicleClearTime = 0;
    const BAD_VEHICLE_CLEAR_INTERVAL = 30.0; // Clear bad set every 30s so destroyed vehicles can be retried
    const vehicleInitialPosition: Map<number, mod.Vector> = new Map(); // vehicleObjId -> initial position
    const ABANDONED_VEHICLE_DISTANCE = 150.0; // If empty vehicle moved >150m from spawn point, treat as abandoned
    function getVehiclePosition(vehicle: mod.Vehicle): mod.Vector | null {
        try {
            return mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
        } catch (_e) {
            return null;
        }
    }
    function getVehicleDistanceFromSpawn(vehicle: mod.Vehicle, vehicleObjId: number): number {
        const initialPos = vehicleInitialPosition.get(vehicleObjId);
        if (!initialPos) return -1;
        try {
            const currentPos = getVehiclePosition(vehicle);
            if (!currentPos) return -1;
            const dx = mod.XComponentOf(currentPos) - mod.XComponentOf(initialPos);
            const dy = mod.YComponentOf(currentPos) - mod.YComponentOf(initialPos);
            const dz = mod.ZComponentOf(currentPos) - mod.ZComponentOf(initialPos);
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        } catch (_e) {
            return -1;
        }
    }
    function getSpawnerSearchDistance(spawnerId: number): number {
        const state = spawnerStateMap.get(spawnerId);
        return state?.vehicleDef.category === 'Air' ? 150.0 : 80.0;
    }
    function initSpawnerStateTracking(): void {
        spawnerStateMap.clear();
        vehicleIdToSpawnerId.clear();
        vehicleInitialPosition.clear();
        const allDefs = [...getTeam1Vehicles(), ...getTeam2Vehicles()];
        for (const def of allDefs) {
            if (!spawnerStateMap.has(def.spawnerId)) {
                spawnerStateMap.set(def.spawnerId, {
                    spawnerId: def.spawnerId,
                    vehicleDef: def,
                    availability: 'no_vehicle',
                    vehicleObjId: null,
                    cooldownStartTime: 0,
                    cooldownDuration: SPAWNER_COOLDOWN_SECONDS,
                    firstEmptySeat: -1,
                    totalSeats: 0,
                    occupiedSeats: 0,
                });
            }
        }
    }
    function probeVehicleSeats(state: SpawnerState): void {
        if (state.vehicleObjId === null) {
            state.availability = state.availability === 'cooldown' ? 'cooldown' : 'no_vehicle';
            state.firstEmptySeat = -1;
            state.totalSeats = 0;
            state.occupiedSeats = 0;
            return;
        }
        const vehicle = findVehicleById(state.vehicleObjId);
        if (!vehicle) {
            vehicleIdToSpawnerId.delete(state.vehicleObjId);
            vehicleInitialPosition.delete(state.vehicleObjId);
            state.vehicleObjId = null;
            state.availability = 'no_vehicle';
            state.firstEmptySeat = -1;
            state.totalSeats = 0;
            state.occupiedSeats = 0;
            return;
        }
        let seatCount = 1;
        try { seatCount = mod.GetVehicleSeatCount(vehicle); } catch (_e) {}
        state.totalSeats = seatCount;
        let occupiedCount = 0;
        let firstEmpty = -1;
        for (let s = 0; s < seatCount; s++) {
            try {
                if (mod.IsVehicleSeatOccupied(vehicle, s)) {
                    occupiedCount++;
                } else if (firstEmpty === -1) {
                    firstEmpty = s;
                }
            } catch (_e) {}
        }
        state.occupiedSeats = occupiedCount;
        state.firstEmptySeat = firstEmpty;
        if (occupiedCount === 0) {
            const dist = getVehicleDistanceFromSpawn(vehicle, state.vehicleObjId!);
            if (dist >= 0 && dist > ABANDONED_VEHICLE_DISTANCE) {
                log(`[VehicleUI] Detached abandoned ${state.vehicleDef.label} (${Math.round(dist)}m from spawn, spawner ${state.spawnerId})`);
                vehicleIdToSpawnerId.delete(state.vehicleObjId!);
                vehicleInitialPosition.delete(state.vehicleObjId!);
                state.vehicleObjId = null;
                state.availability = 'no_vehicle';
                state.firstEmptySeat = -1;
                state.totalSeats = 0;
                state.occupiedSeats = 0;
                return;
            }
            state.availability = 'empty';
        } else if (firstEmpty !== -1) {
            let seat0Occupied = false;
            try { seat0Occupied = mod.IsVehicleSeatOccupied(vehicle, 0); } catch (_e) {}
            if (seat0Occupied) {
                state.availability = 'has_seats';  // Piloted by teammate, spare seats
            } else {
                state.availability = 'empty';  // No driver - deploy as pilot (CYAN)
            }
        } else {
            state.availability = 'full';
        }
    }
    function matchVehicleToSpawner(vehicle: mod.Vehicle, vehicleObjId: number, lenient: boolean = false): void {
        let vehicleTeamNorm = 0;
        if (!badVehicleIds.has(vehicleObjId)) {
            try {
                const vTeam = mod.GetVehicleTeam(vehicle);
                if (vTeam) {
                    const t1 = mod.GetTeam(1);
                    const t2 = mod.GetTeam(2);
                    if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vehicleTeamNorm = 1;
                    else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vehicleTeamNorm = 2;
                }
            } catch (_e) {
                badVehicleIds.add(vehicleObjId);
            }
        }
        for (const [spawnerId, state] of spawnerStateMap) {
            if (state.vehicleObjId !== null) continue;
            const spawnerTeamId = getSpawnerTeamId(spawnerId);
            if (vehicleTeamNorm !== 0 && vehicleTeamNorm !== spawnerTeamId) continue;
            const matchTypes = state.vehicleDef.matchTypes ?? [state.vehicleDef.type];
            if (!matchesAnyVehicleType(vehicle, matchTypes)) {
                if (!lenient) continue;
                const vehicleIsAir = isAirVehicleType(vehicle);
                const spawnerIsAir = state.vehicleDef.category === 'Air';
                if (vehicleIsAir !== spawnerIsAir) continue;
            }
            state.vehicleObjId = vehicleObjId;
            vehicleIdToSpawnerId.set(vehicleObjId, spawnerId);
            const initPos = getVehiclePosition(vehicle);
            if (initPos) vehicleInitialPosition.set(vehicleObjId, initPos);
            probeVehicleSeats(state);
            log(`[VehicleUI] Tracked ${state.vehicleDef.label} vehicle ${vehicleObjId} -> spawner ${spawnerId} (team${vehicleTeamNorm} -> team${spawnerTeamId}, ${state.availability})`);
            return;
        }
    }
    function pruneExpiredSpawnRequests(now: number): void {
        for (const [playerId, request] of pendingSpawnRequestsByPlayerId.entries()) {
            if ((playerSeatGeneration.get(playerId) ?? 0) !== request.seatGen || now - request.time > MAX_SPAWN_ASSIGN_SECONDS) {
                pendingSpawnRequestsByPlayerId.delete(playerId);
                assignedSpawnedVehicleIdByPlayerId.delete(playerId);
            }
        }
    }
    function findPlayerById(playerId: number): mod.Player | null {
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return null;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                try {
                    if (mod.GetObjId(player) === playerId) return player;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function claimSpawnedVehicleForPlayer(playerId: number, request: PendingSpawnRequest, vehicle: mod.Vehicle, vehicleObjId: number): void {
        reserveVehicleForHuman(vehicleObjId, playerId);
        assignedSpawnedVehicleIdByPlayerId.set(playerId, vehicleObjId);
        pendingSpawnRequestsByPlayerId.delete(playerId);
        const player = findPlayerById(playerId);
        if (!player) return;
        if ((playerSeatGeneration.get(playerId) ?? 0) !== request.seatGen) return;
        if (isPlayerOnDeployScreen(player)) {
            logDebug(`[VehicleUI] Spawn event advancing ${request.label} claim for player ${playerId}`);
            deployAndSeatPlayer(player, playerId, vehicleObjId, 0, request.label, request.seatGen, true);
            return;
        }
        try {
            if (hasSoldier(player) && isAlive(player)) {
                logDebug(`[VehicleUI] Spawn event seating alive player ${playerId} into ${request.label}`);
                seatPlayerDirectly(player, vehicle, 0, request.label, 0, true, request.seatGen);
            }
        } catch (_e) {}
    }
    function assignSpawnedVehicleToPendingPlayer(vehicle: mod.Vehicle, vehicleObjId: number): void {
        if (pendingSpawnRequestsByPlayerId.size === 0) return;
        const now = mod.GetMatchTimeElapsed();
        pruneExpiredSpawnRequests(now);
        if (pendingSpawnRequestsByPlayerId.size === 0) return;
        const matchedSpawnerId = vehicleIdToSpawnerId.get(vehicleObjId);
        if (matchedSpawnerId !== undefined) {
            for (const [playerId, request] of pendingSpawnRequestsByPlayerId.entries()) {
                if (request.spawnerId !== matchedSpawnerId) continue;
                claimSpawnedVehicleForPlayer(playerId, request, vehicle, vehicleObjId);
                logDebug(`[VehicleUI] Assigned spawned ${request.label} vehicle ${vehicleObjId} to player ${playerId} via spawner ${matchedSpawnerId}`);
                return;
            }
        }
        const vehiclePos = getVehiclePosition(vehicle);
        if (!vehiclePos) return;
        for (const [playerId, request] of pendingSpawnRequestsByPlayerId.entries()) {
            if (!matchesAnyVehicleType(vehicle, request.matchTypes.length > 0 ? request.matchTypes : [request.vehicleType])) continue;
            try {
                const spawner = mod.GetVehicleSpawner(request.spawnerId);
                if (!spawner) continue;
                const spawnerPos = mod.GetObjectPosition(spawner as unknown as mod.Object);
                if (!spawnerPos) continue;
                if (mod.DistanceBetween(spawnerPos, vehiclePos) > getSpawnerSearchDistance(request.spawnerId)) continue;
            } catch (_e) {
                continue;
            }
            claimSpawnedVehicleForPlayer(playerId, request, vehicle, vehicleObjId);
            logDebug(`[VehicleUI] Assigned spawned ${request.label} vehicle ${vehicleObjId} to player ${playerId} via spawner proximity`);
            return;
        }
    }
    function scanExistingVehicles(): void {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return;
            const count = mod.CountOf(allVehicles);
            let matched = 0;
            const now = mod.GetMatchTimeElapsed();
            if (now - lastBadVehicleClearTime > BAD_VEHICLE_CLEAR_INTERVAL) {
                badVehicleIds.clear();
                lastBadVehicleClearTime = now;
            }
            for (const [vId, spawnerId] of vehicleIdToSpawnerId.entries()) {
                const state = spawnerStateMap.get(spawnerId);
                if (!state) continue;
                const vehicle = findVehicleById(vId);
                if (!vehicle) {
                    vehicleIdToSpawnerId.delete(vId);
                    vehicleInitialPosition.delete(vId);
                    state.vehicleObjId = null;
                    state.availability = 'no_vehicle';
                    continue;
                }
                if (badVehicleIds.has(vId)) {
                    vehicleIdToSpawnerId.delete(vId);
                    vehicleInitialPosition.delete(vId);
                    state.vehicleObjId = null;
                    state.availability = 'no_vehicle';
                    continue;
                }
                let vTeamNorm = 0;
                try {
                    const vTeam = mod.GetVehicleTeam(vehicle);
                    if (vTeam) {
                        const t1 = mod.GetTeam(1);
                        const t2 = mod.GetTeam(2);
                        if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vTeamNorm = 1;
                        else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vTeamNorm = 2;
                    }
                } catch (_e) {
                    badVehicleIds.add(vId);
                    vehicleIdToSpawnerId.delete(vId);
                    vehicleInitialPosition.delete(vId);
                    state.vehicleObjId = null;
                    state.availability = 'no_vehicle';
                    continue;
                }
                if (vTeamNorm !== 0) {
                    const spawnerTeam = getSpawnerTeamId(spawnerId);
                    if (vTeamNorm !== spawnerTeam) {
                        logDebug(`[VehicleUI] Detaching vehicle ${vId} from spawner ${spawnerId}: vehicle team ${vTeamNorm} != spawner team ${spawnerTeam}`);
                        vehicleIdToSpawnerId.delete(vId);
                        vehicleInitialPosition.delete(vId);
                        state.vehicleObjId = null;
                        state.availability = 'no_vehicle';
                    }
                }
            }
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    const vId = mod.GetObjId(vehicle);
                    if (vehicleIdToSpawnerId.has(vId)) continue;
                    if (badVehicleIds.has(vId)) continue; // Skip vehicles that threw GetVehicleTeam
                    matchVehicleToSpawner(vehicle, vId, false);
                    if (vehicleIdToSpawnerId.has(vId)) matched++;
                } catch (_e) {}
            }
            if (matched > 0) {
                let unmatched = 0;
                const unmatchedLabels: string[] = [];
                for (const [_sid, st] of spawnerStateMap) {
                    if (st.vehicleObjId === null && st.availability !== 'cooldown') {
                        unmatched++;
                        unmatchedLabels.push(st.vehicleDef.label);
                    }
                }
                log(`[VehicleUI] Scan matched ${matched} vehicles${unmatched > 0 ? `, still unmatched: ${unmatchedLabels.join(', ')}` : ' (all spawners tracked)'}`);
            }
        } catch (_e) {}
    }
    function getSpawnerTeamId(spawnerId: number): number {
        for (const def of getTeam1Vehicles()) {
            if (def.spawnerId === spawnerId) return 1;
        }
        for (const def of getTeam2Vehicles()) {
            if (def.spawnerId === spawnerId) return 2;
        }
        return 0;
    }
    function reprobeVehicle(vehicleObjId: number): void {
        const spawnerId = vehicleIdToSpawnerId.get(vehicleObjId);
        if (spawnerId === undefined) return;
        const state = spawnerStateMap.get(spawnerId);
        if (!state) return;
        probeVehicleSeats(state);
    }
    function getSpawnerCooldownProgress(spawnerId: number): number {
        const state = spawnerStateMap.get(spawnerId);
        if (!state || state.availability !== 'cooldown') return 1.0;
        const elapsed = mod.GetMatchTimeElapsed() - state.cooldownStartTime;
        return Math.min(1.0, elapsed / state.cooldownDuration);
    }
    const lastDeathTimeByPlayerId: Map<number, number> = new Map();
    const DEATHCAM_BLOCK_SECONDS = 3.0;
    const hasEverDeployedByPlayerId: Set<number> = new Set();
    const lastUndeployTimeByPlayerId: Map<number, number> = new Map();
    const knownHumanPlayers: Set<number> = new Set();
    const knownAIPlayers: Set<number> = new Set();
    let tentativeHumanPlayerId: number | null = null;
    function isPlayerHumanCached(player: mod.Player): boolean {
        const playerId = mod.GetObjId(player);
        if (knownHumanPlayers.has(playerId)) return true;
        if (knownAIPlayers.has(playerId)) return false;
        const cachedAI = aiStatusByPlayerId[playerId];
        if (cachedAI === true) {
            knownAIPlayers.add(playerId);
            if (tentativeHumanPlayerId === playerId) tentativeHumanPlayerId = null;
            return false;
        }
        if (cachedAI === false) {
            knownHumanPlayers.add(playerId);
            return true;
        }
        try {
            if (hasSoldier(player)) {
                const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
                if (isAI) {
                    knownAIPlayers.add(playerId);
                    if (tentativeHumanPlayerId === playerId) tentativeHumanPlayerId = null;
                    return false;
                }
                knownHumanPlayers.add(playerId);
                return true;
            }
        } catch (_e) {}
        if (tentativeHumanPlayerId === playerId) return true;
        if (tentativeHumanPlayerId === null) {
            tentativeHumanPlayerId = playerId;
            log(`[VehicleUI] Tentative human: player ${playerId} (no soldier, no cache)`);
            return true;
        }
        return false;
    }
    function isPlayerOnDeployScreen(player: mod.Player): boolean {
        try {
            const playerId = mod.GetObjId(player);
            const matchTime = mod.GetMatchTimeElapsed();
            const lastDeathTime = lastDeathTimeByPlayerId.get(playerId);
            if (lastDeathTime !== undefined && matchTime - lastDeathTime < DEATHCAM_BLOCK_SECONDS) {
                return false;
            }
            const soldierExists = hasSoldier(player);
            if (soldierExists) return false;
            const playerIsAlive = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsAlive);
            const isInVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
            const isManDown = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsManDown);
            if (playerIsAlive || isInVehicle || isManDown) return false;
            return true;
        } catch (_e) {
            return false;
        }
    }
    function isPanelAlive(playerId: number): boolean {
        const panel = playerPanels.get(playerId);
        if (!panel) return false;
        if (panel.deleted) return false;
        try {
            mod.GetUIWidgetName(panel.uiWidget);
            return true;
        } catch (_e) {
            return false;
        }
    }
    function destroyStalePanel(playerId: number): void {
        const dispose = playerPanelDisposers.get(playerId);
        if (dispose) {
            try { dispose(); } catch (_e) {}
        }
        const panel = playerPanels.get(playerId);
        if (panel) {
            try { panel.delete(); } catch (_e) { /* widget already dead */ }
        }
        playerPanelDisposers.delete(playerId);
        playerPanels.delete(playerId);
        playerButtons.delete(playerId);
        playerButtonStateSetters.delete(playerId);
        playerUIVisible.delete(playerId);
    }
    function createPlayerUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (playerPanels.has(playerId)) {
            destroyStalePanel(playerId);
        }
        const teamId = getPlayerTeamId(player);
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();
        log(`[VehicleUI] Creating UI for player ${playerId} (team ${teamId}, ${vehicles.length} vehicles)`);
        const buttonMap = new Map<number, UI.UITextButton>();
        const buttonStateSetters = new Map<number, SolidUI.Setter<ButtonVisualState>>();
        const childrenParams: UI.UIContainer.ChildParams<UI.UITextButton.Params>[] = [];
        for (let i = 0; i < vehicles.length; i++) {
            const vehicle = vehicles[i];
            const row = Math.floor(i / BUTTONS_PER_ROW);
            const col = i % BUTTONS_PER_ROW;
            const btnX = col * (BUTTON_SIZE + BUTTON_GAP);
            const btnY = row * ROW_HEIGHT;
            const matchTypes = vehicle.matchTypes ?? [vehicle.type];
            const spawnerId = vehicle.spawnerId;
            const vehicleType = vehicle.type;
            const vehicleLabel = vehicle.label;
            childrenParams.push({
                type: UI.UITextButton,
                x: btnX,
                y: btnY,
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                anchor: mod.UIAnchor.TopLeft,
                visible: true,
                enabled: true,
                baseColor: mod.CreateVector(0.0, 0.4, 0.9),
                hoverColor: mod.CreateVector(0.5, 0.85, 1.0),
                pressedColor: mod.CreateVector(0.3, 1.0, 0.5),
                bgColor: mod.CreateVector(0.0, 0.3, 0.4),
                bgAlpha: 0.9,
                onClick: async (clickPlayer: mod.Player) => {
                    handleVehicleClick(clickPlayer, teamId, spawnerId, vehicleType, matchTypes, vehicleLabel);
                },
                message: mod.Message("{}", vehicleLabel),
                textSize: 10,
                textColor: UI.COLORS.WHITE,
                textAlpha: 1.0,
            });
        }
        try {
            const panel = new UI.UIContainer({
                x: UI_PANEL_X,
                y: UI_PANEL_Y,
                width: 280,
                height: 280,
                anchor: mod.UIAnchor.TopLeft,
                visible: false,
                bgAlpha: 0.0,
                depth: mod.UIDepth.AboveGameUI,
                receiver: player,
                childrenParams: childrenParams,
            });
            playerPanels.set(playerId, panel);
            for (let i = 0; i < vehicles.length && i < panel.children.length; i++) {
                const child = panel.children[i];
                if (child instanceof UI.UITextButton) {
                    buttonMap.set(vehicles[i].spawnerId, child);
                }
            }
            playerButtons.set(playerId, buttonMap);
            SolidUI.createRoot((dispose) => {
                playerPanelDisposers.set(playerId, dispose);
                for (const vehicle of vehicles) {
                    const button = buttonMap.get(vehicle.spawnerId);
                    if (!button) continue;
                    const [buttonState, setButtonState] = SolidUI.createSignal<ButtonVisualState>({
                        enabled: true,
                        baseColor: COLOR_BLUE,
                    });
                    buttonStateSetters.set(vehicle.spawnerId, setButtonState);
                    SolidUI.createEffect(() => {
                        const state = buttonState();
                        try {
                            button.setEnabled(state.enabled).setBaseColor(state.baseColor);
                        } catch (_e) {}
                    });
                }
            });
            playerButtonStateSetters.set(playerId, buttonStateSetters);
            updateButtonStatusForPlayer(playerId, teamId);
            logDebug(`[VehicleUI] Panel created for player ${playerId}`);
        } catch (e) {
            log(`[VehicleUI] Failed to create UI for player ${playerId}: ${e}`);
        }
    }
    function handleVehicleClick(
        player: mod.Player,
        teamId: number,
        spawnerId: number,
        vehicleType: mod.VehicleList,
        matchTypes: mod.VehicleList[],
        vehicleLabel: string
    ): void {
        const playerId = mod.GetObjId(player);
        const matchTime = mod.GetMatchTimeElapsed();
        const pendingRequest = pendingSpawnRequestsByPlayerId.get(playerId);
        if (pendingRequest) {
            if (matchTime - pendingRequest.time <= MAX_SPAWN_ASSIGN_SECONDS) {
                logDebug(`[VehicleUI] Ignoring repeat click while ${pendingRequest.label} request is still in flight for player ${playerId}`);
                showVehicleRequestNotification(`Vehicle request in progress: ${pendingRequest.label}`);
                return;
            }
            pendingSpawnRequestsByPlayerId.delete(playerId);
        }
        if (pendingDeploySeat.has(playerId) || assignedSpawnedVehicleIdByPlayerId.has(playerId)) {
            logDebug(`[VehicleUI] Ignoring repeat click while seat assignment is still in flight for player ${playerId}`);
            return;
        }
        const currentTime = now(true);
        if (currentTime - lastButtonClickTime < BUTTON_DEBOUNCE_SECONDS) return;
        lastButtonClickTime = currentTime;
        const playerTeamId = getPlayerTeamId(player);
        if (playerTeamId !== teamId) return;
        if (isJetVehicle(vehicleType)) {
            const cooldownRemaining = getJetCooldownRemaining(playerId);
            if (cooldownRemaining > 0) {
                try {
                    mod.DisplayCustomNotificationMessage(
                        mod.Message("{0}", `Jet cooldown: ${Math.ceil(cooldownRemaining)}s`),
                        mod.CustomNotificationSlots.MessageText1,
                        3.0,
                        player
                    );
                } catch (_e) {}
                return;
            }
        }
        if (!isPlayerOnDeployScreen(player)) return;
        scanExistingVehicles();
        const state = spawnerStateMap.get(spawnerId);
        const availability = state?.availability ?? 'no_vehicle';
        if (availability === 'cooldown') {
            logDebug(`[VehicleUI] Click blocked: ${vehicleLabel} spawner ${spawnerId} is on cooldown`);
            return;
        }
        if (availability === 'full') {
            logDebug(`[VehicleUI] Click blocked: ${vehicleLabel} all seats full`);
            return;
        }
        if (availability === 'no_vehicle') {
            log(`[VehicleUI] Player ${playerId} clicked ${vehicleLabel} (no_vehicle -> force spawn)`);
            const gen = (playerSeatGeneration.get(playerId) ?? 0) + 1;
            playerSeatGeneration.set(playerId, gen);
            const spawner = getVehicleSpawnerById(spawnerId);
            if (!spawner) {
                logDebug(`[VehicleUI] Spawner ${spawnerId} not found`);
                return;
            }
            pendingSpawnRequestsByPlayerId.delete(playerId);
            assignedSpawnedVehicleIdByPlayerId.delete(playerId);
            pendingSpawnRequestsByPlayerId.set(playerId, {
                spawnerId,
                teamId,
                vehicleType,
                matchTypes,
                label: vehicleLabel,
                seatGen: gen,
                time: mod.GetMatchTimeElapsed(),
            });
            beginDeployFlow(player, playerId);
            try {
                try {
                    mod.SetVehicleSpawnerVehicleType(spawner, vehicleType);
                } catch (_e) { /* spawner may reject type change */ }
                mod.ForceVehicleSpawnerSpawn(spawner);
                logDebug(`[VehicleUI] Force-spawned ${vehicleLabel} from spawner ${spawnerId}`);
                if (isJetVehicle(vehicleType)) {
                    setJetCooldown(playerId);
                }
            } catch (e) {
                logDebug(`[VehicleUI] Force spawn failed: ${e}`);
                clearSuppressState(playerId);
                showPlayerUI(player);
                return;
            }
            try {
                mod.EnablePlayerDeploy(player, true);
                mod.SetRedeployTime(player, 0);
                mod.DeployPlayer(player);
            } catch (e) {
                logDebug(`[VehicleUI] Deploy failed: ${e}`);
                clearSuppressState(playerId);
                return;
            }
            waitForSpawnedVehicleThenDeploy(
                player, playerId, matchTypes, new Set(), spawnerId,
                vehicleLabel, gen, teamId, 0
            );
            return;
        }
        log(`[VehicleUI] Player ${playerId} clicked ${vehicleLabel} (${availability})`);
        pendingSpawnRequestsByPlayerId.delete(playerId);
        assignedSpawnedVehicleIdByPlayerId.delete(playerId);
        const gen = (playerSeatGeneration.get(playerId) ?? 0) + 1;
        playerSeatGeneration.set(playerId, gen);
        if (availability === 'has_seats' && state?.vehicleObjId !== null) {
            const targetVehicleId = state!.vehicleObjId!;
            const spareSeat = state!.firstEmptySeat;
            if (spareSeat < 0) {
                logDebug(`[VehicleUI] Click blocked: ${vehicleLabel} has no spare seats`);
                return;
            }
            log(`[VehicleUI] Spare seat deploy: ${vehicleLabel} vehicle ${targetVehicleId} seat ${spareSeat}`);
            deployAndSeatPlayer(player, playerId, targetVehicleId, spareSeat, vehicleLabel, gen, false);
        } else {
            if (availability === 'empty' && state?.vehicleObjId !== null) {
                const targetVehicleId = state!.vehicleObjId!;
                reserveVehicleForHuman(targetVehicleId, playerId);
                log(`[VehicleUI] Pilot deploy (existing empty): ${vehicleLabel} vehicle ${targetVehicleId}`);
                deployAndSeatPlayer(player, playerId, targetVehicleId, 0, vehicleLabel, gen, true);
                return;
            }
            logDebug(`[VehicleUI] ${vehicleLabel} not currently available at spawner ${spawnerId}`);
            showVehicleRequestNotification(`${vehicleLabel} unavailable - waiting for map respawn`);
            showPlayerUI(player);
        }
    }
    function clearSuppressState(playerId: number): void {
        suppressUIUntilByPlayerId.delete(playerId);
        pendingDeploySeat.delete(playerId);
        pendingSpawnRequestsByPlayerId.delete(playerId);
        assignedSpawnedVehicleIdByPlayerId.delete(playerId);
        clearReservationsForPlayer(playerId);
    }
    function isCurrentSeatGeneration(playerId: number, seatGen: number): boolean {
        return (playerSeatGeneration.get(playerId) ?? 0) === seatGen;
    }
    function clearSuppressStateIfCurrent(playerId: number, seatGen?: number): void {
        if (seatGen !== undefined && !isCurrentSeatGeneration(playerId, seatGen)) return;
        clearSuppressState(playerId);
    }
    function beginDeployFlow(player: mod.Player, playerId: number): void {
        suppressUIUntilByPlayerId.set(playerId, mod.GetMatchTimeElapsed() + (MAX_SPAWN_ASSIGN_SECONDS + 2.0));
        hidePlayerUI(player);
    }
    const reservedVehicleIds: Map<number, { playerId: number; expiresAt: number }> = new Map();
    const reservedSpawnerIds: Map<number, { playerId: number; expiresAt: number }> = new Map();
    const RESERVATION_DURATION = 12.0;
    function reserveSpawnerForHuman(spawnerId: number, playerId?: number): void {
        if (playerId === undefined) return;
        reservedSpawnerIds.set(spawnerId, {
            playerId,
            expiresAt: mod.GetMatchTimeElapsed() + RESERVATION_DURATION
        });
    }
    function reserveVehicleForHuman(vehicleObjId: number, playerId?: number): void {
        if (playerId === undefined) return;
        reservedVehicleIds.set(vehicleObjId, {
            playerId,
            expiresAt: mod.GetMatchTimeElapsed() + RESERVATION_DURATION
        });
    }
    function clearReservationsForPlayer(playerId: number): void {
        for (const [key, res] of reservedVehicleIds.entries()) {
            if (res.playerId === playerId) reservedVehicleIds.delete(key);
        }
        for (const [key, res] of reservedSpawnerIds.entries()) {
            if (res.playerId === playerId) reservedSpawnerIds.delete(key);
        }
    }
    function pruneExpiredReservations(): void {
        const now = mod.GetMatchTimeElapsed();
        for (const [key, res] of reservedVehicleIds.entries()) {
            if (now > res.expiresAt) reservedVehicleIds.delete(key);
        }
        for (const [key, res] of reservedSpawnerIds.entries()) {
            if (now > res.expiresAt) reservedSpawnerIds.delete(key);
        }
    }
    export function vehicleUI_IsSpawnerReservedForHuman(spawnerId: number): boolean {
        const res = reservedSpawnerIds.get(spawnerId);
        if (!res) return false;
        if (mod.GetMatchTimeElapsed() > res.expiresAt) {
            reservedSpawnerIds.delete(spawnerId);
            return false;
        }
        return true;
    }
    export function vehicleUI_IsVehicleReservedForHuman(vehicle: mod.Vehicle): boolean {
        try {
            const vehicleId = mod.GetObjId(vehicle);
            const res = reservedVehicleIds.get(vehicleId);
            if (!res) return false;
            if (mod.GetMatchTimeElapsed() > res.expiresAt) {
                reservedVehicleIds.delete(vehicleId);
                return false;
            }
            return true;
        } catch (_e) {
            return false;
        }
    }
    function deployAndSeatPlayer(
        player: mod.Player,
        playerId: number,
        vehicleObjId: number,
        seatIndex: number,
        label: string,
        seatGen: number,
        claimRequestedPilot: boolean
    ): void {
        beginDeployFlow(player, playerId);
        try {
            mod.EnablePlayerDeploy(player, true);
            mod.SetRedeployTime(player, 0);
            mod.DeployPlayer(player);
        } catch (e) {
            logDebug(`[VehicleUI] Deploy failed: ${e}`);
            clearSuppressState(playerId);
            return;
        }
        pendingDeploySeat.set(playerId, { vehicleObjId, seatIndex, label, seatGen, claimRequestedPilot });
        waitForAliveAndSeat(player, playerId, vehicleObjId, seatIndex, label, seatGen, claimRequestedPilot, 0);
    }
    function waitForSpawnedVehicleThenDeploy(
        player: mod.Player,
        playerId: number,
        matchTypes: mod.VehicleList[],
        preSpawnIds: Set<number>,
        spawnerId: number,
        label: string,
        seatGen: number,
        teamId: number,
        retryCount: number
    ): void {
        const maxRetries = includesAttackHeli(matchTypes)
            ? Math.floor(ATTACK_HELI_SPAWN_WAIT_SECONDS / 0.1)
            : 60;
        if (!isCurrentSeatGeneration(playerId, seatGen)) {
            logDebug(`[VehicleUI] spawnWait aborted: seatGen stale for ${label}`);
            return;
        }
        const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
        if (assignedVehicleId !== undefined) {
            const assignedVehicle = findVehicleById(assignedVehicleId);
            if (assignedVehicle) {
                assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                pendingSpawnRequestsByPlayerId.delete(playerId);
                reserveVehicleForHuman(assignedVehicleId, playerId);
                logDebug(`[VehicleUI] Using assigned spawned ${label} vehicle ${assignedVehicleId} before deploy`);
                if (hasSoldier(player) && isAlive(player)) {
                    seatPlayerDirectly(player, assignedVehicle, 0, label, 0, true, seatGen);
                } else {
                    deployAndSeatPlayer(player, playerId, assignedVehicleId, 0, label, seatGen, true);
                }
                return;
            }
            assignedSpawnedVehicleIdByPlayerId.delete(playerId);
        }
        const trackedVehicle = findTrackedVehicleForSpawner(spawnerId, matchTypes, teamId);
        if (trackedVehicle) {
            const trackedId = mod.GetObjId(trackedVehicle);
            pendingSpawnRequestsByPlayerId.delete(playerId);
            reserveVehicleForHuman(trackedId, playerId);
            logDebug(`[VehicleUI] Found tracked ${label} vehicle ${trackedId} before deploy`);
            if (hasSoldier(player) && isAlive(player)) {
                seatPlayerDirectly(player, trackedVehicle, 0, label, 0, true, seatGen);
            } else {
                deployAndSeatPlayer(player, playerId, trackedId, 0, label, seatGen, true);
            }
            return;
        }
        const nearbySpawnerVehicle = findVehicleNearSpawner(spawnerId, matchTypes, teamId);
        if (nearbySpawnerVehicle) {
            const nearbyId = mod.GetObjId(nearbySpawnerVehicle);
            pendingSpawnRequestsByPlayerId.delete(playerId);
            reserveVehicleForHuman(nearbyId, playerId);
            logDebug(`[VehicleUI] Found nearby ${label} vehicle ${nearbyId} before deploy`);
            if (hasSoldier(player) && isAlive(player)) {
                seatPlayerDirectly(player, nearbySpawnerVehicle, 0, label, 0, true, seatGen);
            } else {
                deployAndSeatPlayer(player, playerId, nearbyId, 0, label, seatGen, true);
            }
            return;
        }
        if (retryCount < maxRetries) {
            mod.Wait(0.1).then(() => waitForSpawnedVehicleThenDeploy(player, playerId, matchTypes, preSpawnIds, spawnerId, label, seatGen, teamId, retryCount + 1));
            return;
        }
        log(`[VehicleUI] GAVE UP waiting for ${label} spawn before deploy - restoring UI`);
        const state = spawnerStateMap.get(spawnerId);
        if (state && state.availability === 'no_vehicle') {
            state.availability = 'cooldown';
            state.cooldownStartTime = mod.GetMatchTimeElapsed();
            state.cooldownDuration = 5.0;
        }
        clearSuppressStateIfCurrent(playerId, seatGen);
        showPlayerUI(player);
    }
    function waitForAliveAndSeat(
        player: mod.Player,
        playerId: number,
        vehicleObjId: number,
        seatIndex: number,
        label: string,
        seatGen: number,
        claimRequestedPilot: boolean,
        retryCount: number
    ): void {
        const MAX_RETRIES = 80; // 8 seconds max at 0.1s intervals
        if (!isCurrentSeatGeneration(playerId, seatGen)) {
            logDebug(`[VehicleUI] seatWait aborted: seatGen stale for ${label}`);
            return;
        }
        try {
            if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)) {
                logDebug(`[VehicleUI] Already in vehicle (auto-seated) for ${label}`);
                clearSuppressStateIfCurrent(playerId, seatGen);
                return;
            }
        } catch (_e) {}
        let alive = false;
        try {
            if (hasSoldier(player)) alive = isAlive(player);
        } catch (_e) {}
        if (!alive) {
            if (retryCount >= 6) {
                const stillOnDeploy = isPlayerOnDeployScreen(player);
                if (stillOnDeploy) {
                    log(`[VehicleUI] Deploy failed (still on deploy screen after ${retryCount} retries) - restoring UI for ${label}`);
                    clearSuppressStateIfCurrent(playerId, seatGen);
                    showPlayerUI(player);
                    return;
                }
            }
            if (retryCount < MAX_RETRIES) {
                mod.Wait(0.1).then(() => waitForAliveAndSeat(player, playerId, vehicleObjId, seatIndex, label, seatGen, claimRequestedPilot, retryCount + 1));
                return;
            }
            logDebug(`[VehicleUI] GAVE UP waiting for alive: ${label}`);
            clearSuppressStateIfCurrent(playerId, seatGen);
            showPlayerUI(player);
            return;
        }
        logDebug(`[VehicleUI] Player alive after ${retryCount} retries, seating in ${label}`);
        const vehicle = findVehicleById(vehicleObjId);
        if (!vehicle) {
            logDebug(`[VehicleUI] Target vehicle ${vehicleObjId} gone for ${label}`);
            clearSuppressStateIfCurrent(playerId, seatGen);
            return;
        }
        let actualSeat = seatIndex;
        if (actualSeat !== 0) {
            try {
                if (actualSeat < 0 || mod.IsVehicleSeatOccupied(vehicle, actualSeat)) {
                    actualSeat = -1;
                    const sc = mod.GetVehicleSeatCount(vehicle);
                    for (let s = 0; s < sc; s++) {
                        try {
                            if (!mod.IsVehicleSeatOccupied(vehicle, s)) {
                                actualSeat = s;
                                break;
                            }
                        } catch (_e) {}
                    }
                }
            } catch (_e) {}
            if (actualSeat < 0) {
                logDebug(`[VehicleUI] No free seat in ${label} vehicle ${vehicleObjId}`);
                clearSuppressState(playerId);
                return;
            }
        }
        seatPlayerDirectly(player, vehicle, actualSeat, label, 0, claimRequestedPilot, seatGen);
    }
    function waitForAliveAndSearch(
        player: mod.Player,
        playerId: number,
        matchTypes: mod.VehicleList[],
        preSpawnIds: Set<number>,
        spawnerId: number,
        teamId: number,
        label: string,
        seatGen: number,
        retryCount: number
    ): void {
        const MAX_RETRIES = 80;
        if (!isCurrentSeatGeneration(playerId, seatGen)) {
            logDebug(`[VehicleUI] searchWait aborted: seatGen stale for ${label}`);
            return;
        }
        try {
            if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)) {
                logDebug(`[VehicleUI] Already in vehicle (auto-seated) for ${label}`);
                clearSuppressStateIfCurrent(playerId, seatGen);
                return;
            }
        } catch (_e) {}
        let alive = false;
        try {
            if (hasSoldier(player)) alive = isAlive(player);
        } catch (_e) {}
        if (!alive && retryCount < MAX_RETRIES) {
            if (retryCount >= 30) {
                const stillOnDeploy = isPlayerOnDeployScreen(player);
                if (stillOnDeploy) {
                    log(`[VehicleUI] Deploy failed (still on deploy screen after ${retryCount} retries) - restoring UI for ${label}`);
                    clearSuppressStateIfCurrent(playerId, seatGen);
                    showPlayerUI(player);
                    return;
                }
            }
            mod.Wait(0.05).then(() => waitForAliveAndSearch(player, playerId, matchTypes, preSpawnIds, spawnerId, teamId, label, seatGen, retryCount + 1));
            return;
        }
        if (!alive) {
            log(`[VehicleUI] GAVE UP waiting for alive in search: ${label} - restoring UI`);
            clearSuppressStateIfCurrent(playerId, seatGen);
            showPlayerUI(player);
            return;
        }
        searchAndSeatInNewVehicle(player, playerId, matchTypes, preSpawnIds, spawnerId, teamId, label, seatGen, 0);
    }
    function searchAndSeatInNewVehicle(
        player: mod.Player,
        playerId: number,
        matchTypes: mod.VehicleList[],
        preSpawnIds: Set<number>,
        spawnerId: number,
        teamId: number,
        label: string,
        seatGen: number,
        retryCount: number
    ): void {
        const MAX_RETRIES = 80; // 4 seconds at 0.05s intervals
        if (!isCurrentSeatGeneration(playerId, seatGen)) {
            return;
        }
        try {
            if (safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle)) {
                logDebug(`[VehicleUI] Already in vehicle for ${label}`);
                clearSuppressState(playerId);
                return;
            }
        } catch (_e) {}
        const assignedVehicleId = assignedSpawnedVehicleIdByPlayerId.get(playerId);
        if (assignedVehicleId !== undefined) {
            const assignedVehicle = findVehicleById(assignedVehicleId);
            if (assignedVehicle) {
                assignedSpawnedVehicleIdByPlayerId.delete(playerId);
                reserveVehicleForHuman(assignedVehicleId, playerId);
                logDebug(`[VehicleUI] Using assigned spawned ${label} vehicle ${assignedVehicleId}`);
                seatPlayerDirectly(player, assignedVehicle, 0, label, 0, true, seatGen);
                return;
            }
            assignedSpawnedVehicleIdByPlayerId.delete(playerId);
        }
        const freshSpawnerVehicle = findNewVehicleNearSpawner(spawnerId, matchTypes, preSpawnIds);
        if (freshSpawnerVehicle) {
            const freshVehicleId = mod.GetObjId(freshSpawnerVehicle);
            matchVehicleToSpawner(freshSpawnerVehicle, freshVehicleId, true);
            logDebug(`[VehicleUI] Found fresh ${label} vehicle ${freshVehicleId} for spawner ${spawnerId}`);
            seatPlayerDirectly(player, freshSpawnerVehicle, 0, label, 0, true, seatGen);
            return;
        }
        const trackedVehicle = findTrackedVehicleForSpawner(spawnerId, matchTypes, teamId);
        if (trackedVehicle) {
            reserveVehicleForHuman(mod.GetObjId(trackedVehicle), playerId);
            logDebug(`[VehicleUI] Found tracked ${label} vehicle for spawner ${spawnerId}`);
            seatPlayerDirectly(player, trackedVehicle, 0, label, 0, true, seatGen);
            return;
        }
        const nearbySpawnerVehicle = findVehicleNearSpawner(spawnerId, matchTypes, teamId);
        if (nearbySpawnerVehicle) {
            reserveVehicleForHuman(mod.GetObjId(nearbySpawnerVehicle), playerId);
            logDebug(`[VehicleUI] Found nearby ${label} vehicle for spawner ${spawnerId}`);
            seatPlayerDirectly(player, nearbySpawnerVehicle, 0, label, 0, true, seatGen);
            return;
        }
        if (retryCount < MAX_RETRIES) {
            mod.Wait(0.05).then(() => searchAndSeatInNewVehicle(player, playerId, matchTypes, preSpawnIds, spawnerId, teamId, label, seatGen, retryCount + 1));
            return;
        }
        log(`[VehicleUI] GAVE UP searching for ${label} after ${MAX_RETRIES} retries - restoring UI`);
        clearSuppressStateIfCurrent(playerId, seatGen);
        showPlayerUI(player);
    }
    function seatPlayerDirectly(player: mod.Player, vehicle: mod.Vehicle, seatIndex: number, label: string, retryCount: number = 0, claimRequestedPilot: boolean = false, seatGen?: number): void {
        const playerId = mod.GetObjId(player);
        const MAX_SEAT_RETRIES = 4;
        let targetSeatIndex = seatIndex;
        let seatName = targetSeatIndex === 0 ? 'pilot' : `seat ${targetSeatIndex}`;
        log(`[VehicleUI] seatPlayerDirectly attempt ${retryCount + 1}/${MAX_SEAT_RETRIES + 1}: player ${playerId} -> ${seatName} in ${label}`);
        if (seatGen !== undefined && !isCurrentSeatGeneration(playerId, seatGen)) {
            logDebug(`[VehicleUI] seatDirect aborted: seatGen stale for ${label}`);
            return;
        }
        try {
            const playerTeam = getPlayerTeamId(player);
            let vehicleTeam = 0;
            try {
                const vTeam = mod.GetVehicleTeam(vehicle);
                if (vTeam) {
                    const t1 = mod.GetTeam(1);
                    const t2 = mod.GetTeam(2);
                    if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vehicleTeam = 1;
                    else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vehicleTeam = 2;
                }
            } catch (_e) {}
            if (vehicleTeam !== 0 && playerTeam !== 0 && vehicleTeam !== playerTeam) {
                log(`[VehicleUI] BLOCKED enemy vehicle: player team ${playerTeam}, vehicle team ${vehicleTeam}, ${label}`);
                clearSuppressStateIfCurrent(playerId, seatGen);
                showPlayerUI(player);
                return;
            }
            if (vehicleTeam === 0 && playerTeam !== 0) {
                const vId = mod.GetObjId(vehicle);
                const trackedSpawnerId = vehicleIdToSpawnerId.get(vId);
                if (trackedSpawnerId !== undefined) {
                    const spawnerTeam = getSpawnerTeamId(trackedSpawnerId);
                    if (spawnerTeam !== 0 && spawnerTeam !== playerTeam) {
                        log(`[VehicleUI] BLOCKED enemy vehicle (spawner team): player team ${playerTeam}, spawner team ${spawnerTeam}, ${label}`);
                        clearSuppressStateIfCurrent(playerId, seatGen);
                        showPlayerUI(player);
                        return;
                    }
                }
            }
        } catch (_e) {}
        if (targetSeatIndex === 0) {
            try {
                if (mod.IsVehicleSeatOccupied(vehicle, 0)) {
                    if (claimRequestedPilot) {
                        const currentPilot = safeGetPlayerFromVehicleSeat(vehicle, 0);
                        if (currentPilot && isAISoldier(currentPilot)) {
                            if (safeForcePlayerExitVehicle(currentPilot, vehicle)) {
                                log(`[VehicleUI] Reserved pilot seat for ${label}; ejected AI pilot from seat 0`);
                            } else {
                                log(`[VehicleUI] Reserved pilot seat for ${label}; AI pilot exit failed, forcing player into seat 0`);
                            }
                        }
                    }
                    if (!mod.IsVehicleSeatOccupied(vehicle, 0)) {
                        seatName = 'pilot';
                    } else if (claimRequestedPilot) {
                        const currentPilot = safeGetPlayerFromVehicleSeat(vehicle, 0);
                        if (currentPilot && isAISoldier(currentPilot)) {
                            seatName = 'pilot';
                        } else {
                            log(`[VehicleUI] Pilot claim blocked for ${label}; seat 0 is no longer available for player ${playerId}`);
                            clearSuppressStateIfCurrent(playerId, seatGen);
                            showPlayerUI(player);
                            return;
                        }
                    } else {
                        targetSeatIndex = -1;
                        const seatCount = mod.GetVehicleSeatCount(vehicle);
                        for (let s = 1; s < seatCount; s++) {
                            try {
                                if (!mod.IsVehicleSeatOccupied(vehicle, s)) {
                                    targetSeatIndex = s;
                                    break;
                                }
                            } catch (_e) {}
                        }
                        if (targetSeatIndex < 0) {
                            log(`[VehicleUI] Pilot preserved for ${label}; no spare seat available for player ${playerId}`);
                            clearSuppressStateIfCurrent(playerId, seatGen);
                            return;
                        }
                        seatName = `seat ${targetSeatIndex}`;
                        log(`[VehicleUI] Pilot preserved for ${label}; using ${seatName} for player ${playerId}`);
                    }
                }
            } catch (_e) {
                if (claimRequestedPilot) {
                    targetSeatIndex = 0;
                    seatName = 'pilot';
                }
            }
            if (claimRequestedPilot && targetSeatIndex === 0) {
                try {
                    const seatCount = mod.GetVehicleSeatCount(vehicle);
                    for (let s = 1; s < seatCount; s++) {
                        const occupant = safeGetPlayerFromVehicleSeat(vehicle, s);
                        if (occupant && isAISoldier(occupant)) {
                            if (safeForcePlayerExitVehicle(occupant, vehicle)) {
                                log(`[VehicleUI] Pre-cleared AI occupant from ${label} seat ${s} for human pilot claim`);
                            }
                        }
                    }
                } catch (_e) {}
            }
        }
        try {
            mod.ForcePlayerToSeat(player, vehicle, targetSeatIndex);
        } catch (e) {
            log(`[VehicleUI] ForcePlayerToSeat(${targetSeatIndex}) threw for ${label}: ${e}`);
        }
        mod.Wait(0.25).then(() => {
            const inVehicle = safeGetSoldierStateBool(player, mod.SoldierStateBool.IsInVehicle);
            log(`[VehicleUI] Post-seat verify: player ${playerId} inVehicle=${inVehicle}, attempt=${retryCount + 1} for ${label}`);
            if (inVehicle) {
                clearSuppressStateIfCurrent(playerId, seatGen);
                if (claimRequestedPilot && targetSeatIndex === 0) {
                    purgeAIOccupantsForHumanPilot(vehicle, label, 4);
                    try {
                        const seatCount = mod.GetVehicleSeatCount(vehicle);
                        for (let s = 1; s < seatCount; s++) {
                            const occupant = safeGetPlayerFromVehicleSeat(vehicle, s);
                            if (occupant && isAISoldier(occupant)) {
                                if (safeForcePlayerExitVehicle(occupant, vehicle)) {
                                    log(`[VehicleUI] Cleared AI occupant from ${label} seat ${s} after human pilot claim`);
                                }
                            }
                        }
                    } catch (_e) {}
                }
                if (targetSeatIndex === 0) {
                    try {
                        const isTank = mod.CompareVehicleName(vehicle, mod.VehicleList.Abrams) ||
                                       mod.CompareVehicleName(vehicle, mod.VehicleList.Leopard);
                        const isIFV = mod.CompareVehicleName(vehicle, mod.VehicleList.M2Bradley) ||
                                     mod.CompareVehicleName(vehicle, mod.VehicleList.CV90);
                        const isAA = mod.CompareVehicleName(vehicle, mod.VehicleList.Cheetah) ||
                                    mod.CompareVehicleName(vehicle, mod.VehicleList.Gepard);
                        const isMarauder = mod.CompareVehicleName(vehicle, mod.VehicleList.Marauder) ||
                                          mod.CompareVehicleName(vehicle, mod.VehicleList.Marauder_Pax);
                        if (isTank) {
                            mod.SetVehicleMaxHealthMultiplier(vehicle, TANK_HEALTH_MULTIPLIER);
                        } else if (isIFV) {
                            mod.SetVehicleMaxHealthMultiplier(vehicle, IFV_HEALTH_MULTIPLIER);
                        } else if (isAA) {
                            mod.SetVehicleMaxHealthMultiplier(vehicle, AA_HEALTH_MULTIPLIER);
                        } else if (isMarauder) {
                            mod.SetVehicleMaxHealthMultiplier(vehicle, MARAUDER_HEALTH_MULTIPLIER);
                        }
                    } catch (_e) {}
                }
                return;
            }
            if (retryCount < MAX_SEAT_RETRIES) {
                seatPlayerDirectly(player, vehicle, targetSeatIndex, label, retryCount + 1, claimRequestedPilot, seatGen);
            } else {
                log(`[VehicleUI] GAVE UP seating player ${playerId} in ${label} after ${MAX_SEAT_RETRIES + 1} attempts`);
                clearSuppressStateIfCurrent(playerId, seatGen);
                showPlayerUI(player);
            }
        });
    }
    function purgeAIOccupantsForHumanPilot(vehicle: mod.Vehicle, label: string, remainingPasses: number): void {
        if (remainingPasses <= 0) return;
        mod.Wait(0.35).then(() => {
            try {
                const seatCount = mod.GetVehicleSeatCount(vehicle);
                for (let s = 1; s < seatCount; s++) {
                    const occupant = safeGetPlayerFromVehicleSeat(vehicle, s);
                    if (occupant && isAISoldier(occupant)) {
                        if (safeForcePlayerExitVehicle(occupant, vehicle)) {
                            log(`[VehicleUI] Purged late AI occupant from ${label} seat ${s} after human pilot claim`);
                        }
                    }
                }
            } catch (_e) {}
            purgeAIOccupantsForHumanPilot(vehicle, label, remainingPasses - 1);
        });
    }
    function showPlayerUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        if (!isPlayerOnDeployScreen(player)) {
            playerUIVisible.delete(playerId);
            return;
        }
        const panel = playerPanels.get(playerId);
        if (!panel) return;
        try {
            panel.show();
            playerUIVisible.add(playerId);
        } catch (_e) {
            destroyStalePanel(playerId);
        }
    }
    function hidePlayerUI(player: mod.Player): void {
        const playerId = mod.GetObjId(player);
        const panel = playerPanels.get(playerId);
        if (!panel) return;
        panel.hide();
        playerUIVisible.delete(playerId);
    }
    function getVehicleSpawnerById(spawnerId: number): mod.VehicleSpawner | null {
        try { return mod.GetVehicleSpawner(spawnerId); } catch (_e) { return null; }
    }
    function getAllVehicleIds(): Set<number> {
        const ids = new Set<number>();
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return ids;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try { ids.add(mod.GetObjId(vehicle)); } catch (_e) {}
            }
        } catch (_e) {}
        return ids;
    }
    function findVehicleById(vehicleId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try { if (mod.GetObjId(vehicle) === vehicleId) return vehicle; } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function findTrackedVehicleForSpawner(spawnerId: number, vehicleTypes: mod.VehicleList[], teamId: number): mod.Vehicle | null {
        const state = spawnerStateMap.get(spawnerId);
        if (!state || state.vehicleObjId === null) return null;
        const vehicle = findVehicleById(state.vehicleObjId);
        if (!vehicle) return null;
        try {
            if (!matchesAnyVehicleType(vehicle, vehicleTypes)) return null;
            let vehicleTeamNorm = 0;
            try {
                const vTeam = mod.GetVehicleTeam(vehicle);
                if (vTeam) {
                    const t1 = mod.GetTeam(1);
                    const t2 = mod.GetTeam(2);
                    if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vehicleTeamNorm = 1;
                    else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vehicleTeamNorm = 2;
                }
            } catch (_e) {}
            if (vehicleTeamNorm !== 0 && vehicleTeamNorm !== teamId) return null;
            if (vehicleTeamNorm === 0 && teamId !== 0) {
                const trackedSpawner = vehicleIdToSpawnerId.get(state.vehicleObjId!);
                if (trackedSpawner !== undefined) {
                    const trackedTeam = getSpawnerTeamId(trackedSpawner);
                    if (trackedTeam !== 0 && trackedTeam !== teamId) return null;
                }
            }
            return vehicle;
        } catch (_e) {
            return null;
        }
    }
    function findVehicleNearSpawner(spawnerId: number, vehicleTypes: mod.VehicleList[], teamId: number): mod.Vehicle | null {
        try {
            const spawner = mod.GetVehicleSpawner(spawnerId);
            if (!spawner) return null;
            const state = spawnerStateMap.get(spawnerId);
            const nearDistance = state?.vehicleDef.category === 'Air' ? 150.0 : 80.0;
            const spawnerPos = mod.GetObjectPosition(spawner as unknown as mod.Object);
            if (!spawnerPos) return null;
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    if (!matchesAnyVehicleType(vehicle, vehicleTypes)) continue;
                    let vehicleTeamNorm = 0;
                    try {
                        const vTeam = mod.GetVehicleTeam(vehicle);
                        if (vTeam) {
                            const t1 = mod.GetTeam(1);
                            const t2 = mod.GetTeam(2);
                            if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vehicleTeamNorm = 1;
                            else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vehicleTeamNorm = 2;
                        }
                    } catch (_e) {}
                    if (vehicleTeamNorm !== 0 && vehicleTeamNorm !== teamId) continue;
                    if (vehicleTeamNorm === 0 && teamId !== 0) {
                        const vId = mod.GetObjId(vehicle);
                        const trackedSpawner = vehicleIdToSpawnerId.get(vId);
                        if (trackedSpawner !== undefined) {
                            const trackedTeam = getSpawnerTeamId(trackedSpawner);
                            if (trackedTeam !== 0 && trackedTeam !== teamId) continue;
                        }
                    }
                    const vehiclePos = getVehiclePosition(vehicle);
                    if (!vehiclePos) continue;
                    if (mod.DistanceBetween(spawnerPos, vehiclePos) > nearDistance) continue;
                    return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function findNewVehicleNearSpawner(spawnerId: number, vehicleTypes: mod.VehicleList[], preSpawnVehicleIds: Set<number>): mod.Vehicle | null {
        const spawnerTeam = getSpawnerTeamId(spawnerId);
        try {
            const spawner = mod.GetVehicleSpawner(spawnerId);
            if (!spawner) return null;
            const spawnerPos = mod.GetObjectPosition(spawner as unknown as mod.Object);
            if (!spawnerPos) return null;
            const nearDistance = getSpawnerSearchDistance(spawnerId);
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    const vehicleObjId = mod.GetObjId(vehicle);
                    if (preSpawnVehicleIds.has(vehicleObjId)) continue;
                    if (!matchesAnyVehicleType(vehicle, vehicleTypes)) continue;
                    if (spawnerTeam !== 0) {
                        let vehicleTeamNorm = 0;
                        try {
                            const vTeam = mod.GetVehicleTeam(vehicle);
                            if (vTeam) {
                                const t1 = mod.GetTeam(1);
                                const t2 = mod.GetTeam(2);
                                if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vehicleTeamNorm = 1;
                                else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vehicleTeamNorm = 2;
                            }
                        } catch (_e) {}
                        if (vehicleTeamNorm !== 0 && vehicleTeamNorm !== spawnerTeam) continue;
                        if (vehicleTeamNorm === 0) {
                            const trackedSpawner = vehicleIdToSpawnerId.get(vehicleObjId);
                            if (trackedSpawner !== undefined) {
                                const trackedTeam = getSpawnerTeamId(trackedSpawner);
                                if (trackedTeam !== 0 && trackedTeam !== spawnerTeam) continue;
                            }
                        }
                    }
                    const vehiclePos = getVehiclePosition(vehicle);
                    if (!vehiclePos) continue;
                    if (mod.DistanceBetween(spawnerPos, vehiclePos) > nearDistance) continue;
                    return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function matchesAnyVehicleType(vehicle: mod.Vehicle, vehicleTypes: mod.VehicleList[]): boolean {
        for (const vehicleType of vehicleTypes) {
            try { if (mod.CompareVehicleName(vehicle, vehicleType)) return true; } catch (_e) {}
        }
        return false;
    }
    function findUntrackedVehicleOfType(vehicleTypes: mod.VehicleList[], forTeamId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    if (!matchesAnyVehicleType(vehicle, vehicleTypes)) continue;
                    let vTeamNorm = 0;
                    try {
                        const vTeam = mod.GetVehicleTeam(vehicle);
                        if (vTeam) {
                            const t1 = mod.GetTeam(1);
                            const t2 = mod.GetTeam(2);
                            if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vTeamNorm = 1;
                            else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vTeamNorm = 2;
                        }
                    } catch (_e) {}
                    if (vTeamNorm !== forTeamId) continue;
                    let seat0Blocked = false;
                    try {
                        if (mod.IsVehicleSeatOccupied(vehicle, 0)) {
                            const occupant = mod.GetPlayerFromVehicleSeat(vehicle, 0);
                            if (!occupant || !isAISoldier(occupant)) {
                                seat0Blocked = true;
                            }
                        }
                    } catch (_e) {}
                    if (seat0Blocked) continue;
                    return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function findAnyVehicleOfTypeRegardlessOfTeam(vehicleTypes: mod.VehicleList[]): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    if (!matchesAnyVehicleType(vehicle, vehicleTypes)) continue;
                    const vId = mod.GetObjId(vehicle);
                    if (vehicleIdToSpawnerId.has(vId)) continue;
                    let seat0Blocked = false;
                    try {
                        if (mod.IsVehicleSeatOccupied(vehicle, 0)) {
                            const occupant = mod.GetPlayerFromVehicleSeat(vehicle, 0);
                            if (!occupant || !isAISoldier(occupant)) {
                                seat0Blocked = true;
                            }
                        }
                    } catch (_e) {}
                    if (seat0Blocked) continue;
                    return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function isAirVehicleType(vehicle: mod.Vehicle): boolean {
        try {
            return mod.CompareVehicleName(vehicle, mod.VehicleList.UH60) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.UH60_Pax) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.AH64) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.AH6M) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.Eurocopter) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.F22) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.F16) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.JAS39) ||
                   mod.CompareVehicleName(vehicle, mod.VehicleList.SU57);
        } catch (_e) {
            return false;
        }
    }
    function findNewVehicleOfType(
        vehicleTypes: mod.VehicleList[],
        preSpawnVehicleIds: Set<number>,
        forTeamId?: number
    ): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    const vId = mod.GetObjId(vehicle);
                    if (preSpawnVehicleIds.has(vId)) continue;
                    if (forTeamId) {
                        let vTeamNorm = 0;
                        try {
                            const vTeam = mod.GetVehicleTeam(vehicle);
                            if (vTeam) {
                                const t1 = mod.GetTeam(1);
                                const t2 = mod.GetTeam(2);
                                if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vTeamNorm = 1;
                                else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vTeamNorm = 2;
                            }
                        } catch (_e) {}
                        if (vTeamNorm !== 0 && vTeamNorm !== forTeamId) continue;
                    }
                    if (matchesAnyVehicleType(vehicle, vehicleTypes)) return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    function findEmptyVehicleOfType(vehicleTypes: mod.VehicleList[], forTeamId: number): mod.Vehicle | null {
        try {
            const allVehicles = mod.AllVehicles();
            if (!allVehicles) return null;
            const count = mod.CountOf(allVehicles);
            for (let i = 0; i < count; i++) {
                const vehicle = mod.ValueInArray(allVehicles, i) as mod.Vehicle;
                if (!vehicle) continue;
                try {
                    let vTeamNorm = 0;
                    try {
                        const vTeam = mod.GetVehicleTeam(vehicle);
                        if (vTeam) {
                            const t1 = mod.GetTeam(1);
                            const t2 = mod.GetTeam(2);
                            if (t1 && mod.GetObjId(vTeam) === mod.GetObjId(t1)) vTeamNorm = 1;
                            else if (t2 && mod.GetObjId(vTeam) === mod.GetObjId(t2)) vTeamNorm = 2;
                        }
                    } catch (_e) {}
                    if (vTeamNorm !== 0 && vTeamNorm !== forTeamId) continue;
                    if (vTeamNorm === 0) {
                        const trackedSpawnerId = vehicleIdToSpawnerId.get(mod.GetObjId(vehicle));
                        if (trackedSpawnerId === undefined) continue; // untracked team=0: skip
                        if (getSpawnerTeamId(trackedSpawnerId) !== forTeamId) continue; // enemy spawner: skip
                    }
                    if (!matchesAnyVehicleType(vehicle, vehicleTypes)) continue;
                    let seat0Blocked = false;
                    try {
                        if (mod.IsVehicleSeatOccupied(vehicle, 0)) {
                            const occupant = mod.GetPlayerFromVehicleSeat(vehicle, 0);
                            if (!occupant || !isAISoldier(occupant)) {
                                seat0Blocked = true;
                            }
                        }
                    } catch (_e) {}
                    if (seat0Blocked) continue;
                    const vId = mod.GetObjId(vehicle);
                    const dist = getVehicleDistanceFromSpawn(vehicle, vId);
                    if (dist >= 0 && dist > ABANDONED_VEHICLE_DISTANCE) continue;
                    return vehicle;
                } catch (_e) {}
            }
        } catch (_e) {}
        return null;
    }
    const COLOR_BLUE   = mod.CreateVector(0.0, 0.4, 0.9);
    const COLOR_GREEN  = mod.CreateVector(0.2, 0.8, 0.3);
    const COLOR_BLACK  = mod.CreateVector(0.1, 0.1, 0.1);
    function updateButtonStatusForPlayer(playerId: number, teamId: number): void {
        const buttons = playerButtons.get(playerId);
        if (!buttons) return;
        const vehicles = teamId === 1 ? getTeam1Vehicles() : getTeam2Vehicles();
        for (const vehicle of vehicles) {
            const button = buttons.get(vehicle.spawnerId);
            if (!button) continue;
            try {
                let buttonEnabled = true;
                let baseColor = COLOR_BLUE;
                if (isJetVehicle(vehicle.type)) {
                    const jetCooldownRemaining = getJetCooldownRemaining(playerId);
                    if (jetCooldownRemaining > 0) {
                        buttonEnabled = false;
                        baseColor = COLOR_BLACK;
                        button.setEnabled(buttonEnabled).setBaseColor(baseColor);
                        continue;
                    }
                }
                const state = spawnerStateMap.get(vehicle.spawnerId);
                if (state) {
                    switch (state.availability) {
                        case 'empty':
                            buttonEnabled = true;
                            baseColor = COLOR_BLUE;
                            break;
                        case 'has_seats':
                            buttonEnabled = true;
                            baseColor = COLOR_GREEN;
                            break;
                        case 'full':
                            buttonEnabled = false;
                            baseColor = COLOR_BLACK;
                            break;
                        case 'cooldown':
                            buttonEnabled = false;
                            baseColor = COLOR_BLACK;
                            break;
                        case 'no_vehicle':
                            buttonEnabled = true;
                            baseColor = COLOR_BLUE;
                            break;
                    }
                }
                button.setEnabled(buttonEnabled).setBaseColor(baseColor);
            } catch (_e) {}
        }
    }
    export function initVehicleSpawnUI(): void {
        detectMapAndLoadVehicleConfig();
        vehicleUIInitialized = true;
        playerPanels.clear();
        playerButtons.clear();
        playerButtonStateSetters.clear();
        playerPanelDisposers.clear();
        playerUIVisible.clear();
        jetCooldownByPlayerId.clear();
        suppressUIUntilByPlayerId.clear();
        pendingSpawnRequestsByPlayerId.clear();
        assignedSpawnedVehicleIdByPlayerId.clear();
        playerSeatGeneration.clear();
        knownHumanPlayers.clear();
        knownAIPlayers.clear();
        tentativeHumanPlayerId = null;
        hasEverDeployedByPlayerId.clear();
        lastUndeployTimeByPlayerId.clear();
        lastDeathTimeByPlayerId.clear();
        reservedVehicleIds.clear();
        reservedSpawnerIds.clear();
        initSpawnerStateTracking();
        mod.Wait(2.0).then(() => scanExistingVehicles());
        log(`[VehicleUI] Module initialized for map: ${detectedMapName}`);
    }
    export function vehicleUI_HandleButtonEvent(player: mod.Player, widget: mod.UIWidget, buttonEvent: mod.UIButtonEvent): void {
        Events.OnPlayerUIButtonEvent.trigger(player, widget, buttonEvent);
    }
    export function vehicleUI_OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        hasEverDeployedByPlayerId.add(playerId);
        lastUndeployTimeByPlayerId.delete(playerId);
        lastDeathTimeByPlayerId.delete(playerId);
        const pending = pendingDeploySeat.get(playerId);
        if (pending) {
            pendingDeploySeat.delete(playerId);
            const { vehicleObjId, seatIndex, label, seatGen, claimRequestedPilot } = pending;
            if ((playerSeatGeneration.get(playerId) ?? 0) === seatGen) {
                logDebug(`[VehicleUI] OnPlayerDeployed instant-seat: player ${playerId} -> ${label}`);
                const vehicle = findVehicleById(vehicleObjId);
                if (vehicle) {
                    seatPlayerDirectly(player, vehicle, seatIndex, label, 0, claimRequestedPilot, seatGen);
                    return;
                }
            }
        }
    }
    export function vehicleUI_OnPlayerUndeployed(player: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastUndeployTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
        suppressUIUntilByPlayerId.delete(playerId);
    }
    export function vehicleUI_OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
        if (!eventVehicle) return;
        try {
            const vehicleObjId = mod.GetObjId(eventVehicle);
            matchVehicleToSpawner(eventVehicle, vehicleObjId);
            assignSpawnedVehicleToPendingPlayer(eventVehicle, vehicleObjId);
        } catch (_e) {}
    }
    export function vehicleUI_OnVehicleDestroyed(eventVehicle: mod.Vehicle): void {
        if (!eventVehicle) return;
        try {
            const vehicleObjId = mod.GetObjId(eventVehicle);
            const spawnerId = vehicleIdToSpawnerId.get(vehicleObjId);
            if (spawnerId === undefined) return;
            const state = spawnerStateMap.get(spawnerId);
            if (!state) return;
            log(`[VehicleUI] Vehicle ${vehicleObjId} destroyed -> spawner ${spawnerId} cooldown ${SPAWNER_COOLDOWN_SECONDS}s`);
            vehicleIdToSpawnerId.delete(vehicleObjId);
            state.vehicleObjId = null;
            state.availability = 'cooldown';
            state.cooldownStartTime = mod.GetMatchTimeElapsed();
            state.cooldownDuration = SPAWNER_COOLDOWN_SECONDS;
            state.firstEmptySeat = -1;
            state.totalSeats = 0;
            state.occupiedSeats = 0;
        } catch (_e) {}
    }
    export function vehicleUI_OnPlayerEnterVehicle(_player: mod.Player, vehicle: mod.Vehicle): void {
        if (!vehicle) return;
        try {
            const vehicleObjId = mod.GetObjId(vehicle);
            reprobeVehicle(vehicleObjId);
        } catch (_e) {}
    }
    export function vehicleUI_OnPlayerExitVehicle(_player: mod.Player, vehicle: mod.Vehicle): void {
        if (!vehicle) return;
        try {
            const vehicleObjId = mod.GetObjId(vehicle);
            mod.Wait(0.1).then(() => reprobeVehicle(vehicleObjId));
        } catch (_e) {}
    }
    export function onPlayerDeployedHideVehicleUI(player: mod.Player): void {
        if (!player) return;
        if (isAISoldier(player)) return;
        hidePlayerUI(player);
    }
    export function onPlayerDiedShowUI(player?: mod.Player): void {
        if (!player) return;
        const playerId = mod.GetObjId(player);
        lastDeathTimeByPlayerId.set(playerId, mod.GetMatchTimeElapsed());
        clearSuppressState(playerId);
        hidePlayerUI(player);
    }
    let lastTickCheck = 0;
    const TICK_CHECK_INTERVAL = 0.25;
    export function tickVehicleUI(): void {
        const matchTime = mod.GetMatchTimeElapsed();
        if (matchTime - lastTickCheck < TICK_CHECK_INTERVAL) return;
        lastTickCheck = matchTime;
        for (const [_spawnerId, state] of spawnerStateMap) {
            if (state.availability === 'cooldown') {
                const elapsed = matchTime - state.cooldownStartTime;
                if (elapsed >= state.cooldownDuration) {
                    state.availability = 'no_vehicle';
                }
            }
        }
        pruneExpiredReservations();
        if (matchTime - lastUIStatusUpdateTime >= UI_STATUS_UPDATE_INTERVAL) {
            scanExistingVehicles();
        }
        if (matchTime - lastUIStatusUpdateTime >= UI_STATUS_UPDATE_INTERVAL) {
            lastUIStatusUpdateTime = matchTime;
            for (const [_spawnerId, state] of spawnerStateMap) {
                if (state.vehicleObjId !== null && state.availability !== 'cooldown') {
                    probeVehicleSeats(state);
                }
            }
            for (const playerId of playerUIVisible) {
                try {
                    const allPlayers = mod.AllPlayers();
                    const count = mod.CountOf(allPlayers);
                    for (let i = 0; i < count; i++) {
                        const p = mod.ValueInArray(allPlayers, i) as mod.Player;
                        if (!p) continue;
                        if (mod.GetObjId(p) === playerId) {
                            updateButtonStatusForPlayer(playerId, getPlayerTeamId(p));
                            break;
                        }
                    }
                } catch (_e) {}
            }
        }
        try {
            const allPlayers = mod.AllPlayers();
            if (!allPlayers) return;
            const count = mod.CountOf(allPlayers);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(allPlayers, i) as mod.Player;
                if (!player) continue;
                if (!isPlayerHumanCached(player)) continue;
                const playerId = mod.GetObjId(player);
                const onDeployScreen = isPlayerOnDeployScreen(player);
                const suppressUntil = suppressUIUntilByPlayerId.get(playerId);
                if (suppressUntil !== undefined) {
                    if (matchTime < suppressUntil) continue;
                    suppressUIUntilByPlayerId.delete(playerId);
                }
                const isVisible = playerUIVisible.has(playerId);
                if (onDeployScreen && !isVisible) {
                    log(`[VehicleUI] Player ${playerId} on deploy screen - showing UI`);
                    destroyStalePanel(playerId);
                    createPlayerUI(player);
                    showPlayerUI(player);
                    lastDeathTimeByPlayerId.delete(playerId);
                } else if (onDeployScreen && isVisible) {
                    if (!isPanelAlive(playerId)) {
                        log(`[VehicleUI] Player ${playerId} panel died while visible - recreating`);
                        destroyStalePanel(playerId);
                        createPlayerUI(player);
                        showPlayerUI(player);
                    }
                } else if (!onDeployScreen && isVisible) {
                    onPlayerDeployedHideVehicleUI(player);
                }
            }
        } catch (e) {
            log(`[VehicleUI] Tick error: ${e}`);
        }
    }
}


// Module: modules/ScoreboardModule.ts
namespace ConquestV8 {
    const SCORE_PER_KILL = 100;
    const SCORE_PER_CAPTURE = 250;
    const SCORE_PER_REVIVE = 150;
    const KILL_CREDIT_DEDUP_SECONDS = 0.05;
    let initialized = false;
    let ready = false;
    let lastSyncTime = -9999;
    let lastReconfigureTime = -9999;
    function getScoreboardHeaderLabels(): { team1: string; team2: string } {
        const team1Label = getTeamFactionLabel(1);
        const team2Label = getTeamFactionLabel(2);
        const t1Display = team1Label === "UNKNOWN" ? "NATO" : team1Label;
        const t2Display = team2Label === "UNKNOWN" ? "PAX" : team2Label;
        return {
            team1: `${t1Display} FORCES`,
            team2: `${t2Display} FORCES`
        };
    }
    function configureScoreboard(): boolean {
        if (!ENABLE_SCOREBOARD) return false;
        let configured = false;
        try {
            mod.SetScoreboardType(mod.ScoreboardType.CustomTwoTeams);
            configured = true;
        } catch (_e) {
            logDebug("[ConquestV10][Scoreboard] Failed to set scoreboard type");
            configured = false;
        }
        if (!configured) return false;
        safeCall("Scoreboard:Header", () => {
            mod.SetScoreboardHeader(textMessage("NATO FORCES"), textMessage("PAX FORCES"));
        });
        safeCall("Scoreboard:Columns", () => {
            const capturesLabel = SCOREBOARD_CAPTURES_LABEL || "C";
            mod.SetScoreboardColumnNames(
                textMessage("S"),
                textMessage("K"),
                textMessage("D"),
                textMessage("R"),
                textMessage(capturesLabel)
            );
            mod.SetScoreboardColumnWidths(1.1, 0.6, 0.6, 0.6, 0.6);
            mod.SetScoreboardSorting(0, false);
            mod.SetGameModeTargetScore(99999);
        });
        return true;
    }
    export function Scoreboard_reconfigure(reason: string): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD) return;
        const ok = configureScoreboard();
        ready = ok;
        lastReconfigureTime = now(true);
        log(`[ConquestV10][Scoreboard] Reconfigure(${reason}) ready=${ready}`);
        safeCall("Scoreboard:ReconfigureSync", () => syncAllPlayers());
    }
    let sbPlayerIds: number[] = [];
    let sbPlayerScores: number[] = [];
    let sbPlayerKills: number[] = [];
    let sbPlayerDeaths: number[] = [];
    let sbPlayerRevives: number[] = [];
    let sbPlayerCaptures: number[] = [];
    let sbPlayerVehicleScore: number[] = [];  // Accumulated vehicle destruction points
    let sbPlayerLastKillCredit: number[] = [];
    let sbPlayerLastKillVictim: number[] = [];
    let sbPlayerAssists: number[] = [];  // V13: kill assist counter
    export function initScoreboardModule(): void {
        initialized = true;
        ready = false;
        lastSyncTime = -9999;
        sbPlayerIds = [];
        sbPlayerScores = [];
        sbPlayerKills = [];
        sbPlayerDeaths = [];
        sbPlayerRevives = [];
        sbPlayerCaptures = [];
        sbPlayerVehicleScore = [];
        sbPlayerLastKillCredit = [];
        sbPlayerLastKillVictim = [];
        sbPlayerAssists = [];
        if (!ENABLE_SCOREBOARD) return;
        ready = configureScoreboard();
        log(`[ConquestV10][Scoreboard] Initialized (V4 scoring) ready=${ready}`);
        safeCall("Scoreboard:InitialSync", () => syncAllPlayers());
    }
    function ensureInit(): void {
        if (!initialized) initScoreboardModule();
    }
    function requestScoreboardRefresh(): void {
        if (!ready) return;
        lastSyncTime = -9999;
    }
    function findIdxByPlayerId(playerId: number): number {
        return sbPlayerIds.indexOf(playerId);
    }
    function ensurePlayerEntry(player: mod.Player): number {
        if (!mod.IsPlayerValid(player)) return -1;
        const playerId = mod.GetObjId(player);
        let idx = findIdxByPlayerId(playerId);
        if (idx >= 0) return idx;
        sbPlayerIds.push(playerId);
        sbPlayerScores.push(0);
        sbPlayerKills.push(0);
        sbPlayerDeaths.push(0);
        sbPlayerRevives.push(0);
        sbPlayerCaptures.push(0);
        sbPlayerVehicleScore.push(0);
        sbPlayerLastKillCredit.push(-9999);
        sbPlayerLastKillVictim.push(-1);
        sbPlayerAssists.push(0);
        idx = sbPlayerIds.length - 1;
        return idx;
    }
    function recalcScore(idx: number): void {
        const score =
            sbPlayerKills[idx] * SCORE_PER_KILL +
            sbPlayerCaptures[idx] * SCORE_PER_CAPTURE +
            sbPlayerRevives[idx] * SCORE_PER_REVIVE +
            sbPlayerAssists[idx] * SCORE_PER_KILL_ASSIST +  // V13: kill assists
            sbPlayerVehicleScore[idx];  // Vehicle kills already have varying point values
        sbPlayerScores[idx] = mod.Floor(score);
    }
    function pushPlayer(player: mod.Player, idx: number): void {
        if (!ready) return;
        mod.SetScoreboardPlayerValues(
            player,
            sbPlayerScores[idx],
            sbPlayerKills[idx],
            sbPlayerDeaths[idx],
            sbPlayerRevives[idx],
            sbPlayerCaptures[idx]
        );
    }
    let cachedHeaderTeam1: mod.Message | null = null;
    let cachedHeaderTeam2: mod.Message | null = null;
    let cachedHeaderTeam1Label: string | null = null;
    let cachedHeaderTeam2Label: string | null = null;
    function getCachedHeaders(): { team1: mod.Message; team2: mod.Message } {
        const labels = getScoreboardHeaderLabels();
        if (!cachedHeaderTeam1 || cachedHeaderTeam1Label !== labels.team1) {
            cachedHeaderTeam1 = textMessage(labels.team1);
            cachedHeaderTeam1Label = labels.team1;
        }
        if (!cachedHeaderTeam2 || cachedHeaderTeam2Label !== labels.team2) {
            cachedHeaderTeam2 = textMessage(labels.team2);
            cachedHeaderTeam2Label = labels.team2;
        }
        return { team1: cachedHeaderTeam1, team2: cachedHeaderTeam2 };
    }
    function pruneDisconnectedPlayers(): void {
        if (sbPlayerIds.length === 0) return;
        const allPlayers = mod.AllPlayers();
        const count = mod.CountOf(allPlayers);
        const activeIds = new Set<number>();
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(allPlayers, i) as mod.Player;
            if (p) activeIds.add(mod.GetObjId(p));
        }
        for (let i = sbPlayerIds.length - 1; i >= 0; i--) {
            if (!activeIds.has(sbPlayerIds[i])) {
                sbPlayerIds.splice(i, 1);
                sbPlayerScores.splice(i, 1);
                sbPlayerKills.splice(i, 1);
                sbPlayerDeaths.splice(i, 1);
                sbPlayerRevives.splice(i, 1);
                sbPlayerCaptures.splice(i, 1);
                sbPlayerVehicleScore.splice(i, 1);
                sbPlayerLastKillCredit.splice(i, 1);
                sbPlayerLastKillVictim.splice(i, 1);
                sbPlayerAssists.splice(i, 1);
            }
        }
    }
    function syncAllPlayers(): void {
        if (!ready) return;
        pruneDisconnectedPlayers();
        safeCall("Scoreboard:HeaderSync", () => {
            mod.SetScoreboardHeader(textMessage("NATO FORCES"), textMessage("PAX FORCES"));
        });
        const allPlayers = mod.AllPlayers();
        const count = mod.CountOf(allPlayers);
        for (let i = 0; i < count; i++) {
            const p = mod.ValueInArray(allPlayers, i) as mod.Player;
            if (!p) continue;
            const idx = ensurePlayerEntry(p);
            pushPlayer(p, idx);
        }
        const t1 = mod.GetTeam(1);
        const t2 = mod.GetTeam(2);
        if (t1) mod.SetGameModeScore(t1, getTickets(1));
        if (t2) mod.SetGameModeScore(t2, getTickets(2));
        mod.SetScoreboardSorting(0, false);
    }
    export function tickScoreboard(): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        const t = now(true);
        if (t - lastReconfigureTime >= 60.0) {
            safeCall("Scoreboard:PeriodicReconfigure", () => Scoreboard_reconfigure("Periodic"));
        }
        if (t - lastSyncTime < SCOREBOARD_UPDATE_INTERVAL_SECONDS) return;
        lastSyncTime = t;
        safeCall("Scoreboard:Sync", () => syncAllPlayers());
    }
    export function Scoreboard_recordKill(killer: mod.Player, victim?: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!killer || !mod.IsPlayerValid(killer)) return;
        const killerId = mod.GetObjId(killer);
        const idx = ensurePlayerEntry(killer);
        if (idx < 0) return;
        const nowTime = now(true);
        const lastTime = sbPlayerLastKillCredit[idx] ?? -9999;
        const lastVictim = sbPlayerLastKillVictim[idx] ?? -1;
        const victimId = victim ? mod.GetObjId(victim) : -1;
        if (nowTime - lastTime < KILL_CREDIT_DEDUP_SECONDS && lastVictim === victimId && victimId !== -1) {
            return;
        }
        sbPlayerLastKillCredit[idx] = nowTime;
        sbPlayerLastKillVictim[idx] = victimId;
        sbPlayerKills[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushK", () => pushPlayer(killer, idx));
    }
    export function Scoreboard_recordDeath(victim: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!victim || !mod.IsPlayerValid(victim)) return;
        const idx = ensurePlayerEntry(victim);
        if (idx < 0) return;
        sbPlayerDeaths[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushD", () => pushPlayer(victim, idx));
    }
    export function Scoreboard_recordRevive(medic: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!medic) return;
        const idx = ensurePlayerEntry(medic);
        sbPlayerRevives[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushR", () => pushPlayer(medic, idx));
    }
    export function Scoreboard_recordAssist(player: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player || !mod.IsPlayerValid(player)) return;
        const idx = ensurePlayerEntry(player);
        if (idx < 0) return;
        sbPlayerAssists[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushA", () => pushPlayer(player, idx));
    }
    export function Scoreboard_recordCapture(player: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player) return;
        const idx = ensurePlayerEntry(player);
        sbPlayerCaptures[idx]++;
        recalcScore(idx);
        safeCall("Scoreboard:PushC", () => pushPlayer(player, idx));
    }
    export function Scoreboard_recordVehicleKill(killer: mod.Player, vehicle: mod.Vehicle): number {
        ensureInit();
        if (!killer || !vehicle) return 0;
        let points = SCORE_VEHICLE_DEFAULT;
        let category = "unknown";
        const lightVehicles = [
            mod.VehicleList.Quadbike,
            mod.VehicleList.GolfCart,
            mod.VehicleList.Flyer60,
            mod.VehicleList.Marauder
        ];
        const transportVehicles = [
            mod.VehicleList.RHIB,
            mod.VehicleList.Marauder_Pax
        ];
        const ifvVehicles = [
            mod.VehicleList.M2Bradley,
            mod.VehicleList.Vector,
            mod.VehicleList.CV90
        ];
        const aaVehicles = [
            mod.VehicleList.Cheetah,
            mod.VehicleList.Gepard
        ];
        const tankVehicles = [
            mod.VehicleList.Abrams,
            mod.VehicleList.Leopard
        ];
        const heliVehicles = [
            mod.VehicleList.UH60,
            mod.VehicleList.UH60_Pax,
            mod.VehicleList.AH64,
            mod.VehicleList.Eurocopter
        ];
        const jetVehicles = [
            mod.VehicleList.F16,
            mod.VehicleList.F22,
            mod.VehicleList.JAS39,
            mod.VehicleList.SU57
        ];
        for (const vType of lightVehicles) {
            try {
                if (mod.CompareVehicleName(vehicle, vType)) {
                    points = SCORE_VEHICLE_LIGHT;
                    category = "light";
                    break;
                }
            } catch (_e) {}
        }
        if (category === "unknown") {
            for (const vType of transportVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_TRANSPORT;
                        category = "transport";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of ifvVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_IFV;
                        category = "IFV";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of aaVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_AA;
                        category = "AA";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of tankVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_TANK;
                        category = "tank";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of heliVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_HELI;
                        category = "helicopter";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (category === "unknown") {
            for (const vType of jetVehicles) {
                try {
                    if (mod.CompareVehicleName(vehicle, vType)) {
                        points = SCORE_VEHICLE_JET;
                        category = "jet";
                        break;
                    }
                } catch (_e) {}
            }
        }
        if (ENABLE_SCOREBOARD && ready) {
            const idx = ensurePlayerEntry(killer);
            sbPlayerVehicleScore[idx] += points;
            recalcScore(idx);
            safeCall("Scoreboard:PushV", () => pushPlayer(killer, idx));
        }
        log(`[Scoreboard] Vehicle kill: ${category} = ${points} pts for player ${mod.GetObjId(killer)}`);
        return points;
    }
    export function Scoreboard_ensurePlayer(player: mod.Player): void {
        ensureInit();
        if (!ENABLE_SCOREBOARD || !ready) return;
        if (!player) return;
        const idx = ensurePlayerEntry(player);
        safeCall("Scoreboard:PushEnsure", () => pushPlayer(player, idx));
    }
}


// Module: modules/TicketBleedModule.ts
namespace ConquestV8 {
    let initialized = false;
    export function Ticket_Init(): void {
        if (initialized) return;
        initialized = true;
        log("[Ticket] Initialized (starting=" + STARTING_TICKETS + ")");
    }
    export function Ticket_OnPlayerDied(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            Registry_DeductTickets(teamId, TICKET_LOSS_ON_DEATH);
            HUD_flashTeamScore(teamId);
        } catch (e) {
        }
    }
    export function Ticket_OnPlayerRevived(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            const current = Registry_GetTickets(teamId);
            Registry_SetTickets(teamId, current + TICKET_REFUND_ON_REVIVE);
        } catch (e) {
        }
    }
    export function Ticket_Tick(): void {
        const team1Owned = Objective_GetOwnedCount(1);
        const team2Owned = Objective_GetOwnedCount(2);
        const totalObjectives = Registry_GetObjectives().length;
        if (team1Owned > team2Owned) {
            const advantage = team1Owned - team2Owned;
            let bleed = advantage * TICKET_BLEED_PER_FLAG_ADVANTAGE;
            if (TOTAL_CONTROL_BLEED_BONUS > 0 && team1Owned === totalObjectives && totalObjectives > 0) {
                bleed += TOTAL_CONTROL_BLEED_BONUS;
                log("[Ticket] TotalControl! T1 owns all flags - bonus bleed +" + TOTAL_CONTROL_BLEED_BONUS);
            }
            Registry_DeductTickets(2, bleed);
            HUD_flashTeamScore(2);  // V13: flash the score bar that just bled
            logDebug("[Ticket] Bleed: T1 owns " + team1Owned + ", T2 owns " + team2Owned + ", bleeding T2 -" + bleed);
        } else if (team2Owned > team1Owned) {
            const advantage = team2Owned - team1Owned;
            let bleed = advantage * TICKET_BLEED_PER_FLAG_ADVANTAGE;
            if (TOTAL_CONTROL_BLEED_BONUS > 0 && team2Owned === totalObjectives && totalObjectives > 0) {
                bleed += TOTAL_CONTROL_BLEED_BONUS;
                log("[Ticket] TotalControl! T2 owns all flags - bonus bleed +" + TOTAL_CONTROL_BLEED_BONUS);
            }
            Registry_DeductTickets(1, bleed);
            HUD_flashTeamScore(1);  // V13: flash the score bar that just bled
            logDebug("[Ticket] Bleed: T1 owns " + team1Owned + ", T2 owns " + team2Owned + ", bleeding T1 -" + bleed);
        }
    }
    export function Ticket_CheckWinCondition(): number {
        const t1 = Registry_GetTickets(1);
        const t2 = Registry_GetTickets(2);
        if (t1 <= 0 && t2 <= 0) {
            return 0;  // Draw
        } else if (t1 <= 0) {
            return 2;  // Team 2 wins
        } else if (t2 <= 0) {
            return 1;  // Team 1 wins
        }
        return 0;  // No winner yet
    }
    export function Ticket_Reset(): void {
        initialized = false;
        Registry_SetTickets(1, STARTING_TICKETS);
        Registry_SetTickets(2, STARTING_TICKETS);
        log("[Ticket] Reset");
    }
}


// Module: modules/HudModuleParseUI.ts
namespace ConquestV8 {
    const HUD_TEXT_COLOR = mod.CreateVector(1, 1, 1);
    const TEAM1_COLOR = mod.CreateVector(0.443, 0.918, 0.996);  // Cyan #71EAFE (Team 1 NATO)
    const TEAM2_COLOR = mod.CreateVector(1.0, 0.529, 0.396);    // Orange #FF8765 (Team 2 PAX)
    const NEUTRAL_COLOR = mod.CreateVector(0.5, 0.5, 0.5);      // Dark Gray (transparent)
    const CONTESTED_COLOR = mod.CreateVector(0.95, 0.78, 0.2);  // Orange/Yellow (keep for contested)
    const FLASH_COLOR = mod.CreateVector(1, 1, 1);
    const TICKET_BAR_WIDTH = 300;
    const TICKET_BAR_HEIGHT = 8;
    const TICKET_BAR_Y = 20;
    const TICKET_TEXT_Y = 40;
    const TICKET_TEXT_SIZE = 32;
    const FLAG_INDICATOR_SIZE = 35;
    const FLAG_INDICATOR_Y = 45;
    const FLAG_SPACING = 50;
    const FLAG_LETTER_SIZE = 18;
    const CAPTURE_TEXT_Y = 135;
    const CAPTURE_TEXT_SIZE = 14;
    const PROGRESS_BAR_Y = 90;
    const PROGRESS_BAR_WIDTH = 40;
    const PROGRESS_BAR_HEIGHT = 4;
    const FLAG_COUNT_Y = 105;
    const FLAG_COUNT_SIZE = 14;
    const TIMER_TEXT_Y = 118;
    const TIMER_STATE_Y = 138;
    const ONPOINT_OBJ_Y = 126;
    const ONPOINT_STATUS_Y = 148;
    const ONPOINT_COUNT_Y = 168;
    const ONPOINT_BAR_Y = 182;
    const ONPOINT_BAR_W = 200;
    const ONPOINT_BAR_H = 6;
    const HUD_UPDATE_INTERVAL = 0.0167; // 60Hz for smooth pulse animation
    const FLAG_STATE_READ_INTERVAL = 0.5; // Read capture point states every 0.5s (was 60Hz - major perf fix)
    let hudActive = false;
    let sortedObjectives: ObjectiveState[] = [];
    const flagIndexByObjId = new Map<number, number>();
    const flagLetterByObjId = new Map<number, string>();
    interface FlagState {
        ownerId: number;
        capturing: boolean;
        contested: boolean;
        capturingTeam: number;
        progress: number;
    }
    interface OnPointHudState {
        visible: boolean;
        objId: number;
        status: string;
        statusColor: mod.Vector;
        friendlyCount: number;
        enemyCount: number;
        progress: number;
        progressColor: mod.Vector;
    }
    interface RoundTimerHudState {
        visible: boolean;
        minutes: number;
        seconds: number;
        stateText: string;
        stateColor: mod.Vector;
    }
    let disposeHudRoot: (() => void) | null = null;
    let setTeam1Tickets: SolidUI.Setter<number> | null = null;
    let setTeam2Tickets: SolidUI.Setter<number> | null = null;
    let setPulsePhase: SolidUI.Setter<number> | null = null;
    let setTeam1Flash: SolidUI.Setter<number> | null = null;
    let setTeam2Flash: SolidUI.Setter<number> | null = null;
    let setOnPointState: SolidUI.Setter<OnPointHudState> | null = null;
    let setRoundTimerState: SolidUI.Setter<RoundTimerHudState> | null = null;
    const flagSetters: Array<SolidUI.Setter<FlagState>> = [];
    let ticketFlashEnd1 = 0;
    let ticketFlashEnd2 = 0;
    const TICKET_FLASH_DURATION = 0.35;
    let lastFlagStateReadTime = 0;
    const widgetCache = new Map<string, mod.UIWidget>();
    const messageCache = new Map<string, mod.Message>();
    const MESSAGE_CACHE_MAX = 512;
    function getCachedMessage(text: string | number): mod.Message {
        const key = String(text);
        if (!messageCache.has(key)) {
            if (messageCache.size >= MESSAGE_CACHE_MAX) messageCache.clear();
            messageCache.set(key, mod.Message("{}", text));
        }
        return messageCache.get(key)!;
    }
    const timerMessageCache = new Map<string, mod.Message>();
    const TIMER_CACHE_MAX = 128;
    function getCachedTimerMessage(minutes: number, tens: number, ones: number): mod.Message {
        const key = `${minutes}:${tens}${ones}`;
        if (!timerMessageCache.has(key)) {
            if (timerMessageCache.size >= TIMER_CACHE_MAX) timerMessageCache.clear();
            timerMessageCache.set(key, mod.Message("{} : {}{}", minutes, tens, ones));
        }
        return timerMessageCache.get(key)!;
    }
    function lerpColor(from: mod.Vector, to: mod.Vector, t: number): mod.Vector {
        const clamped = Math.max(0, Math.min(1, t));
        return mod.CreateVector(
            mod.XComponentOf(from) + (mod.XComponentOf(to) - mod.XComponentOf(from)) * clamped,
            mod.YComponentOf(from) + (mod.YComponentOf(to) - mod.YComponentOf(from)) * clamped,
            mod.ZComponentOf(from) + (mod.ZComponentOf(to) - mod.ZComponentOf(from)) * clamped
        );
    }
    function findWidget(name: string): mod.UIWidget | null {
        if (widgetCache.has(name)) return widgetCache.get(name)!;
        const w = mod.FindUIWidgetWithName(name);
        if (w) widgetCache.set(name, w);
        return w;
    }
    export function initHudParseUI(): void {
        try {
            hudActive = false;
            widgetCache.clear();
            flagSetters.length = 0;
            sortedObjectives = Registry_GetObjectives();
            sortedObjectives.sort((a, b) => a.letter.localeCompare(b.letter));
            for (let i = 0; i < sortedObjectives.length; i++) {
                const objId = sortedObjectives[i].objId;
                const letter = sortedObjectives[i].letter;
                flagIndexByObjId.set(objId, i);
                flagLetterByObjId.set(objId, letter);
                getCachedMessage(letter);
                getCachedMessage("CAPTURING");
            }
            SolidUI.setLogging(
                (text: string) => { log(`[SolidUI] ${text}`); },
                Logging.LogLevel.Warning,
                true
            );
            log(`[HUD-SolidUI] Initialized with ${sortedObjectives.length} objectives`);
        } catch (e) {
            log(`[HUD-SolidUI] Init error: ${e}`);
        }
    }
    export function startHudParseUI(): void {
        if (hudActive) return;
        hudActive = true;
        if (!ENABLE_GAMEPLAY_HUD) return;
        createTicketBarWidgets();
        createFlagIndicatorWidgets();
        createFlagCountWidget();
        SolidUI.createRoot((dispose) => {
            disposeHudRoot = dispose;
            const [team1Tickets, _setTeam1Tickets] = SolidUI.createSignal(STARTING_TICKETS);
            const [team2Tickets, _setTeam2Tickets] = SolidUI.createSignal(STARTING_TICKETS);
            const [pulsePhase, _setPulsePhase] = SolidUI.createSignal(0);
            const [team1Flash, _setTeam1Flash] = SolidUI.createSignal(0);
            const [team2Flash, _setTeam2Flash] = SolidUI.createSignal(0);
            const [roundTimerState, _setRoundTimerState] = SolidUI.createSignal<RoundTimerHudState>({
                visible: false,
                minutes: 0,
                seconds: 0,
                stateText: "",
                stateColor: HUD_TEXT_COLOR,
            });
            setTeam1Tickets = _setTeam1Tickets;
            setTeam2Tickets = _setTeam2Tickets;
            setPulsePhase = _setPulsePhase;
            setTeam1Flash = _setTeam1Flash;
            setTeam2Flash = _setTeam2Flash;
            setRoundTimerState = _setRoundTimerState;
            flagSetters.length = 0;
            const flagAccessors: Array<SolidUI.Accessor<FlagState>> = [];
            for (let i = 0; i < sortedObjectives.length; i++) {
                const [state, setState] = SolidUI.createSignal<FlagState>({
                    ownerId: 0,
                    capturing: false,
                    contested: false,
                    capturingTeam: 0,
                    progress: 0
                });
                flagAccessors.push(state);
                flagSetters.push(setState);
            }
            const maxTickets = STARTING_TICKETS || 1;
            const team1Ratio = SolidUI.createMemo(() => Math.max(0, Math.min(1, team1Tickets() / maxTickets)));
            const team2Ratio = SolidUI.createMemo(() => Math.max(0, Math.min(1, team2Tickets() / maxTickets)));
            SolidUI.createEffect(() => {
                const width = Math.max(10, TICKET_BAR_WIDTH * team1Ratio());
                const bar = findWidget("Team1TicketBar");
                if (bar) mod.SetUIWidgetSize(bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
            SolidUI.createEffect(() => {
                const bar = findWidget("Team1TicketBar");
                if (bar) mod.SetUIWidgetBgAlpha(bar, Math.min(1.0, 0.9 + team1Flash() * 0.1));
            });
            SolidUI.createEffect(() => {
                const width = Math.max(10, TICKET_BAR_WIDTH * team2Ratio());
                const bar = findWidget("Team2TicketBar");
                if (bar) mod.SetUIWidgetSize(bar, mod.CreateVector(width, TICKET_BAR_HEIGHT, 0));
            });
            SolidUI.createEffect(() => {
                const bar = findWidget("Team2TicketBar");
                if (bar) mod.SetUIWidgetBgAlpha(bar, Math.min(1.0, 0.9 + team2Flash() * 0.1));
            });
            SolidUI.createEffect(() => {
                const tickets = team1Tickets();
                const txt = findWidget("Team1Tickets");
                if (txt) mod.SetUITextLabel(txt, getCachedMessage(Math.floor(tickets)));
            });
            SolidUI.createEffect(() => {
                const flash = team1Flash();
                const txt = findWidget("Team1Tickets");
                if (!txt) return;
                const flicker = flash > 0.01 ? (0.35 + 0.65 * ((Math.sin(pulsePhase() * 8) + 1) / 2)) : 1.0;
                mod.SetUITextColor(txt, lerpColor(TEAM1_COLOR, FLASH_COLOR, flash));
                mod.SetUITextSize(txt, TICKET_TEXT_SIZE);
                mod.SetUITextAlpha(txt, flicker);
                mod.SetUIWidgetBgAlpha(txt, 0.6);
            });
            SolidUI.createEffect(() => {
                const tickets = team2Tickets();
                const txt = findWidget("Team2Tickets");
                if (txt) mod.SetUITextLabel(txt, getCachedMessage(Math.floor(tickets)));
            });
            SolidUI.createEffect(() => {
                const flash = team2Flash();
                const txt = findWidget("Team2Tickets");
                if (!txt) return;
                const flicker = flash > 0.01 ? (0.35 + 0.65 * ((Math.sin(pulsePhase() * 8) + 1) / 2)) : 1.0;
                mod.SetUITextColor(txt, lerpColor(TEAM2_COLOR, FLASH_COLOR, flash));
                mod.SetUITextSize(txt, TICKET_TEXT_SIZE);
                mod.SetUITextAlpha(txt, flicker);
                mod.SetUIWidgetBgAlpha(txt, 0.6);
            });
            for (let i = 0; i < sortedObjectives.length; i++) {
                const flagState = flagAccessors[i];
                const flagIdx = i;
                SolidUI.createEffect(() => {
                    const state = flagState();
                    const shape = findWidget(`FlagShape_${flagIdx}`);
                    const letterWidget = findWidget(`FlagLetter_${flagIdx}`);
                    if (!shape) return;
                    const { friendly: myTeamId } = getLocalTeamIds();
                    let color: mod.Vector;
                    if (state.ownerId === myTeamId && state.ownerId !== 0) {
                        color = TEAM1_COLOR;
                    } else if (state.ownerId !== 0 && state.ownerId !== myTeamId) {
                        color = TEAM2_COLOR;
                    } else {
                        color = NEUTRAL_COLOR;
                    }
                    let alpha = 0.85;
                    if (state.contested || state.capturing) {
                        const p = pulsePhase();
                        const pulse = (Math.sin(p) + 1) / 2;
                        alpha = pulse;
                        if (state.capturingTeam !== 0) {
                            color = state.capturingTeam === myTeamId ? TEAM1_COLOR : TEAM2_COLOR;
                        }
                    }
                    try {
                        mod.SetUIWidgetBgColor(shape, color);
                        mod.SetUIWidgetBgAlpha(shape, alpha);
                        mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThin);
                        mod.SetUIWidgetSize(shape, mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0));
                    } catch (_e) {}
                    if (letterWidget) {
                        try {
                            mod.SetUITextColor(letterWidget, color);
                            mod.SetUITextAlpha(letterWidget, alpha);
                        } catch (_e) {}
                    }
                });
                SolidUI.createEffect(() => {
                    const state = flagState();
                    const pbg = findWidget(`ProgressBarBg_${flagIdx}`);
                    const pbar = findWidget(`ProgressBar_${flagIdx}`);
                    if (!pbg || !pbar) return;
                    const { friendly: myTeamId } = getLocalTeamIds();
                    const shouldShow = state.capturing || state.contested;
                    try {
                        mod.SetUIWidgetVisible(pbg, shouldShow);
                        mod.SetUIWidgetVisible(pbar, shouldShow);
                        if (shouldShow) {
                            const width = Math.max(2, PROGRESS_BAR_WIDTH * state.progress);
                            mod.SetUIWidgetSize(pbar, mod.CreateVector(width, PROGRESS_BAR_HEIGHT, 0));
                            let color = NEUTRAL_COLOR;
                            if (state.capturingTeam === myTeamId) {
                                color = TEAM1_COLOR;
                            } else if (state.capturingTeam !== 0) {
                                color = TEAM2_COLOR;
                            }
                            mod.SetUIWidgetBgColor(pbar, color);
                        }
                    } catch (_e) {}
                });
            }
            SolidUI.createEffect(() => {
                const state = roundTimerState();
                const timerWidget = findWidget("RoundTimerText");
                const stateWidget = findWidget("RoundTimerStateText");
                if (timerWidget) {
                    mod.SetUIWidgetVisible(timerWidget, state.visible);
                    mod.SetUITextLabel(
                        timerWidget,
                        getCachedTimerMessage(
                            state.minutes,
                            Math.floor(state.seconds / 10),
                            state.seconds % 10
                        )
                    );
                }
                if (stateWidget) {
                    mod.SetUIWidgetVisible(stateWidget, state.visible && state.stateText.length > 0);
                    mod.SetUITextLabel(stateWidget, getRoundStateMessage(state.stateText));
                    mod.SetUITextColor(stateWidget, state.stateColor);
                }
            });
        });
        hudStateReadLoop();
        log(`[HUD-SolidUI] Started - ${sortedObjectives.length} flag effects + ticket effects active`);
    }
    export function stopHudParseUI(): void {
        hudActive = false;
        if (disposeHudRoot) {
            disposeHudRoot();
            disposeHudRoot = null;
        }
        setTeam1Tickets = null;
        setTeam2Tickets = null;
        setPulsePhase = null;
        setTeam1Flash = null;
        setTeam2Flash = null;
        setRoundTimerState = null;
        flagSetters.length = 0;
        log(`[HUD-SolidUI] Stopped`);
    }
    function getLocalTeamIds(): { friendly: number; enemy: number } {
        const hostPlayer = tryGetHostPlayer();
        const friendly = hostPlayer ? getPlayerTeamId(hostPlayer) : 1;
        const enemy = friendly === 1 ? 2 : 1;
        return { friendly, enemy };
    }
    async function hudStateReadLoop(): Promise<void> {
        while (hudActive) {
            try {
                const { friendly, enemy } = getLocalTeamIds();
                if (setTeam1Tickets) setTeam1Tickets(getTickets(friendly));
                if (setTeam2Tickets) setTeam2Tickets(getTickets(enemy));
                const matchTime = mod.GetMatchTimeElapsed();
                if (setTeam1Flash) setTeam1Flash(Math.max(0, (ticketFlashEnd1 - matchTime) / TICKET_FLASH_DURATION));
                if (setTeam2Flash) setTeam2Flash(Math.max(0, (ticketFlashEnd2 - matchTime) / TICKET_FLASH_DURATION));
                if (setPulsePhase) {
                    setPulsePhase((prev: number) => {
                        let next = prev + 0.21;
                        if (next > Math.PI * 2) next -= Math.PI * 2;
                        return next;
                    });
                }
                const now = mod.GetMatchTimeElapsed();
                if (now - lastFlagStateReadTime >= FLAG_STATE_READ_INTERVAL) {
                    lastFlagStateReadTime = now;
                    readFlagStatesIntoSignals();
                }
            } catch (_e) {
            }
            await mod.Wait(HUD_UPDATE_INTERVAL);
        }
    }
    function readFlagStatesIntoSignals(): void {
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (!cp) continue;
                const objId = mod.GetObjId(cp);
                const flagIdx = flagIndexByObjId.get(objId);
                if (flagIdx === undefined) continue;
                const setter = flagSetters[flagIdx];
                if (!setter) continue;
                const ownerTeam = mod.GetCurrentOwnerTeam(cp);
                const ownerId = ownerTeam ? mod.GetObjId(ownerTeam) : 0;
                const presence = getPresenceOnPoint(cp);
                const contested = presence.team1 > 0 && presence.team2 > 0;
                const rawProgress = mod.GetCaptureProgress(cp);
                const progress = Math.max(0, Math.min(1, rawProgress));
                let progressTeamId = 0;
                try {
                    const progressTeam = mod.GetOwnerProgressTeam(cp);
                    progressTeamId = progressTeam ? mod.GetObjId(progressTeam) : 0;
                } catch (_e) {
                    progressTeamId = 0;
                }
                const capturingTeam = (progressTeamId === 1 || progressTeamId === 2)
                    ? progressTeamId
                    : determineCapturingTeam(ownerId, presence, contested);
                const capturing = capturingTeam !== 0 && progress > 0 && progress < 1;
                const visualContested = contested && progress > 0 && progress < 1;
                const enemyRecapturing = ownerId !== 0 && capturing && capturingTeam !== ownerId;
                Registry_UpdateObjectiveContested(objId, enemyRecapturing);
                setter({
                    ownerId,
                    capturing,
                    contested: visualContested,
                    capturingTeam,
                    progress
                });
            }
        } catch (_e) {
        }
    }
    export function Hud_OnCapturePointCaptured(cp: mod.CapturePoint): void {
        try {
            const objId = mod.GetObjId(cp);
            const flagIdx = flagIndexByObjId.get(objId);
            if (flagIdx === undefined) return;
            const setter = flagSetters[flagIdx];
            if (!setter) return;
            const ownerTeam = mod.GetCurrentOwnerTeam(cp);
            const ownerId = ownerTeam ? mod.GetObjId(ownerTeam) : 0;
            setter({
                ownerId,
                capturing: false,
                contested: false,
                capturingTeam: 0,
                progress: 0
            });
        } catch (_e) {
        }
    }
    function getPresenceOnPoint(cp: mod.CapturePoint): { team1: number; team2: number } {
        let team1 = 0;
        let team2 = 0;
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p) continue;
                const tid = getPlayerTeamId(p);
                if (tid === 1) team1++;
                else if (tid === 2) team2++;
            }
        } catch (_e) {}
        return { team1, team2 };
    }
    function determineCapturingTeam(owner: number, presence: { team1: number; team2: number }, contested: boolean): number {
        if (contested) return 0;
        if (owner === 0) {
            if (presence.team1 > 0 && presence.team2 === 0) return 1;
            if (presence.team2 > 0 && presence.team1 === 0) return 2;
            return 0;
        }
        if (owner === 1 && presence.team2 > 0 && presence.team1 === 0) return 2;
        if (owner === 2 && presence.team1 > 0 && presence.team2 === 0) return 1;
        return 0;
    }
    function getOnPointStatusText(myTeamId: number, ownerId: number, progressTeamId: number, progress: number): string {
        if (progress >= 1.0 || progress <= 0.0) {
            return ownerId === myTeamId ? "SECURED" : "CONTESTED";
        }
        if (progressTeamId === myTeamId) return "CAPTURING";
        if (progressTeamId !== 0) return "LOSING";
        return "CONTESTED";
    }
    function getOnPointStatusColor(status: string): mod.Vector {
        if (status === "CAPTURING") return mod.CreateVector(0.2, 1.0, 0.2);
        if (status === "LOSING") return mod.CreateVector(1.0, 0.3, 0.3);
        if (status === "CONTESTED") return CONTESTED_COLOR;
        return HUD_TEXT_COLOR;
    }
    function getObjectiveLabelForObjId(objId: number): string {
        const letter = flagLetterByObjId.get(objId);
        return letter ? `OBJ ${letter}` : `OBJ ${objId}`;
    }
    function getObjectiveMessageForObjId(objId: number): mod.Message {
        const letter = flagLetterByObjId.get(objId);
        switch (letter) {
            case "A": return mod.Message("OBJ A");
            case "B": return mod.Message("OBJ B");
            case "C": return mod.Message("OBJ C");
            case "D": return mod.Message("OBJ D");
            case "E": return mod.Message("OBJ E");
            case "F": return mod.Message("OBJ F");
            case "G": return mod.Message("OBJ G");
            default: return mod.Message("OBJECTIVE");
        }
    }
    function getRoundStateMessage(stateText: string): mod.Message {
        if (stateText === "OVERTIME") return mod.Message("OVERTIME");
        return mod.Message("");
    }
    function readOnPointStateIntoSignal(): void {
        if (!setOnPointState) return;
        const hiddenState: OnPointHudState = {
            visible: false,
            objId: 0,
            status: "",
            statusColor: HUD_TEXT_COLOR,
            friendlyCount: 0,
            enemyCount: 0,
            progress: 0,
            progressColor: NEUTRAL_COLOR,
        };
        const host = tryGetHostPlayer();
        if (!host || !mod.IsPlayerValid(host) || !hasSoldier(host) || !isAlive(host)) {
            setOnPointState(hiddenState);
            return;
        }
        let hostId = -1;
        try { hostId = mod.GetObjId(host); } catch (_e) {}
        if (hostId < 0) {
            setOnPointState(hiddenState);
            return;
        }
        const myTeamId = getPlayerTeamId(host);
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (!cp) continue;
                const players = mod.GetPlayersOnPoint(cp);
                const playerCount = mod.CountOf(players);
                let hostOnPoint = false;
                let friendly = 0;
                let enemy = 0;
                for (let j = 0; j < playerCount; j++) {
                    const p = mod.ValueInArray(players, j) as mod.Player;
                    if (!p || !mod.IsPlayerValid(p)) continue;
                    let playerId = -1;
                    try { playerId = mod.GetObjId(p); } catch (_e) { continue; }
                    if (playerId === hostId) hostOnPoint = true;
                    const teamId = getPlayerTeamId(p);
                    if (teamId === myTeamId) friendly++;
                    else if (teamId !== 0) enemy++;
                }
                if (!hostOnPoint) continue;
                const objId = mod.GetObjId(cp);
                const ownerTeam = mod.GetCurrentOwnerTeam(cp);
                const ownerId = ownerTeam ? mod.GetObjId(ownerTeam) : 0;
                const progressTeam = mod.GetOwnerProgressTeam(cp);
                const progressTeamId = progressTeam ? mod.GetObjId(progressTeam) : 0;
                const progress = Math.max(0, Math.min(1, mod.GetCaptureProgress(cp)));
                const status = getOnPointStatusText(myTeamId, ownerId, progressTeamId, progress);
                let progressColor = NEUTRAL_COLOR;
                if (progressTeamId === myTeamId) progressColor = TEAM1_COLOR;
                else if (progressTeamId !== 0) progressColor = TEAM2_COLOR;
                setOnPointState({
                    visible: true,
                    objId,
                    status,
                    statusColor: getOnPointStatusColor(status),
                    friendlyCount: friendly,
                    enemyCount: enemy,
                    progress,
                    progressColor,
                });
                return;
            }
        } catch (_e) {
        }
        setOnPointState(hiddenState);
    }
    function createTicketBarWidgets(): void {
        const team1X = -400;
        mod.AddUIText(
            "Team1TicketBarBg",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bg = findWidget("Team1TicketBarBg");
        if (t1bg) {
            try {
                mod.SetUIWidgetBgColor(t1bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t1bg, 0);
                mod.SetUIWidgetBgFill(t1bg, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
        mod.AddUIText(
            "Team1TicketBar",
            mod.CreateVector(team1X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t1bar = findWidget("Team1TicketBar");
        if (t1bar) {
            try {
                mod.SetUIWidgetBgColor(t1bar, TEAM1_COLOR);
                mod.SetUIWidgetBgAlpha(t1bar, 0.9);
                mod.SetUIWidgetBgFill(t1bar, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
        mod.AddUIText(
            "Team1Tickets",
            mod.CreateVector(team1X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t1txt = findWidget("Team1Tickets");
        if (t1txt) {
            try {
                mod.SetUITextColor(t1txt, TEAM1_COLOR);
                mod.SetUITextSize(t1txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t1txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t1txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t1txt, 0.6);
                mod.SetUIWidgetBgFill(t1txt, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
        const team2X = 400;
        mod.AddUIText(
            "Team2TicketBarBg",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bg = findWidget("Team2TicketBarBg");
        if (t2bg) {
            try {
                mod.SetUIWidgetBgColor(t2bg, mod.CreateVector(0.1, 0.1, 0.1));
                mod.SetUIWidgetBgAlpha(t2bg, 0);
                mod.SetUIWidgetBgFill(t2bg, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
        mod.AddUIText(
            "Team2TicketBar",
            mod.CreateVector(team2X, TICKET_BAR_Y, 0),
            mod.CreateVector(TICKET_BAR_WIDTH, TICKET_BAR_HEIGHT, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const t2bar = findWidget("Team2TicketBar");
        if (t2bar) {
            try {
                mod.SetUIWidgetBgColor(t2bar, TEAM2_COLOR);
                mod.SetUIWidgetBgAlpha(t2bar, 0.9);
                mod.SetUIWidgetBgFill(t2bar, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
        mod.AddUIText(
            "Team2Tickets",
            mod.CreateVector(team2X, TICKET_TEXT_Y, 0),
            mod.CreateVector(100, 40, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", STARTING_TICKETS)
        );
        const t2txt = findWidget("Team2Tickets");
        if (t2txt) {
            try {
                mod.SetUITextColor(t2txt, TEAM2_COLOR);
                mod.SetUITextSize(t2txt, TICKET_TEXT_SIZE);
                mod.SetUITextAnchor(t2txt, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(t2txt, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(t2txt, 0.6);
                mod.SetUIWidgetBgFill(t2txt, mod.UIBgFill.Solid);
            } catch (_e) {}
        }
    }
    function createFlagIndicatorWidgets(): void {
        const count = sortedObjectives.length;
        const totalWidth = (count - 1) * FLAG_SPACING;
        const startX = -totalWidth / 2;
        for (let i = 0; i < count; i++) {
            const letter = sortedObjectives[i].letter;
            const xPos = startX + i * FLAG_SPACING;
            mod.AddUIText(
                `FlagShape_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const shape = findWidget(`FlagShape_${i}`);
            if (shape) {
                try {
                    mod.SetUIWidgetBgColor(shape, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(shape, 0.9);
                    mod.SetUIWidgetBgFill(shape, mod.UIBgFill.OutlineThick);
                    mod.SetUIWidgetVisible(shape, true);
                } catch (_e) {}
            }
            mod.AddUIText(
                `FlagLetter_${i}`,
                mod.CreateVector(xPos, FLAG_INDICATOR_Y, 0),
                mod.CreateVector(FLAG_INDICATOR_SIZE, FLAG_INDICATOR_SIZE, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", letter)
            );
            const letterWidget = findWidget(`FlagLetter_${i}`);
            if (letterWidget) {
                try {
                    mod.SetUITextColor(letterWidget, NEUTRAL_COLOR);
                    mod.SetUITextSize(letterWidget, FLAG_LETTER_SIZE);
                    mod.SetUITextAnchor(letterWidget, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(letterWidget, 0);
                    mod.SetUIWidgetBgFill(letterWidget, mod.UIBgFill.None);
                    mod.SetUIWidgetVisible(letterWidget, true);
                } catch (_e) {}
            }
            mod.AddUIText(
                `CapturingText_${i}`,
                mod.CreateVector(xPos, CAPTURE_TEXT_Y, 0),
                mod.CreateVector(100, 20, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const capText = findWidget(`CapturingText_${i}`);
            if (capText) {
                try {
                    mod.SetUITextColor(capText, HUD_TEXT_COLOR);
                    mod.SetUITextSize(capText, CAPTURE_TEXT_SIZE);
                    mod.SetUITextAnchor(capText, mod.UIAnchor.Center);
                    mod.SetUIWidgetBgAlpha(capText, 0);
                    mod.SetUIWidgetVisible(capText, false);
                } catch (_e) {}
            }
            mod.AddUIText(
                `ProgressBarBg_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbg = findWidget(`ProgressBarBg_${i}`);
            if (pbg) {
                try {
                    mod.SetUIWidgetBgColor(pbg, mod.CreateVector(0.2, 0.2, 0.2));
                    mod.SetUIWidgetBgAlpha(pbg, 0);
                    mod.SetUIWidgetBgFill(pbg, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbg, false);
                } catch (_e) {}
            }
            mod.AddUIText(
                `ProgressBar_${i}`,
                mod.CreateVector(xPos, PROGRESS_BAR_Y, 0),
                mod.CreateVector(0, PROGRESS_BAR_HEIGHT, 0),
                mod.UIAnchor.TopCenter,
                mod.Message("{}", "")
            );
            const pbar = findWidget(`ProgressBar_${i}`);
            if (pbar) {
                try {
                    mod.SetUIWidgetBgColor(pbar, NEUTRAL_COLOR);
                    mod.SetUIWidgetBgAlpha(pbar, 0.9);
                    mod.SetUIWidgetBgFill(pbar, mod.UIBgFill.Solid);
                    mod.SetUIWidgetVisible(pbar, false);
                } catch (_e) {}
            }
        }
    }
    function createFlagCountWidget(): void {
        mod.AddUIText(
            "FlagCountText",
            mod.CreateVector(0, FLAG_COUNT_Y, 0),
            mod.CreateVector(300, 25, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const fct = findWidget("FlagCountText");
        if (fct) {
            try {
                mod.SetUITextColor(fct, HUD_TEXT_COLOR);
                mod.SetUITextSize(fct, FLAG_COUNT_SIZE);
                mod.SetUITextAnchor(fct, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(fct, 0);
            } catch (_e) {}
        }
        mod.AddUIText(
            "RoundTimerText",
            mod.CreateVector(0, TIMER_TEXT_Y, 0),
            mod.CreateVector(95, 24, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{} : {}{}", 0, 0, 0)
        );
        const timer = findWidget("RoundTimerText");
        if (timer) {
            try {
                mod.SetUITextColor(timer, HUD_TEXT_COLOR);
                mod.SetUITextSize(timer, 20);
                mod.SetUITextAnchor(timer, mod.UIAnchor.Center);
                mod.SetUIWidgetBgColor(timer, mod.CreateVector(0, 0, 0));
                mod.SetUIWidgetBgAlpha(timer, 0.45);
                mod.SetUIWidgetBgFill(timer, mod.UIBgFill.Blur);
                mod.SetUIWidgetVisible(timer, false);
            } catch (_e) {}
        }
        mod.AddUIText(
            "RoundTimerStateText",
            mod.CreateVector(0, TIMER_STATE_Y, 0),
            mod.CreateVector(180, 18, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const timerState = findWidget("RoundTimerStateText");
        if (timerState) {
            try {
                mod.SetUITextColor(timerState, CONTESTED_COLOR);
                mod.SetUITextSize(timerState, 14);
                mod.SetUITextAnchor(timerState, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(timerState, 0);
                mod.SetUIWidgetVisible(timerState, false);
            } catch (_e) {}
        }
    }
    function createOnPointWidgets(): void {
        mod.AddUIText(
            "OnPointObjText",
            mod.CreateVector(0, ONPOINT_OBJ_Y, 0),
            mod.CreateVector(220, 24, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const obj = findWidget("OnPointObjText");
        if (obj) {
            try {
                mod.SetUITextColor(obj, mod.CreateVector(0.8, 0.8, 0.8));
                mod.SetUITextSize(obj, 16);
                mod.SetUITextAnchor(obj, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(obj, 0);
                mod.SetUIWidgetVisible(obj, false);
            } catch (_e) {}
        }
        mod.AddUIText(
            "OnPointStatusText",
            mod.CreateVector(0, ONPOINT_STATUS_Y, 0),
            mod.CreateVector(220, 30, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const status = findWidget("OnPointStatusText");
        if (status) {
            try {
                mod.SetUITextColor(status, HUD_TEXT_COLOR);
                mod.SetUITextSize(status, 22);
                mod.SetUITextAnchor(status, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(status, 0);
                mod.SetUIWidgetBgFill(status, mod.UIBgFill.Solid);
                mod.SetUIWidgetVisible(status, false);
            } catch (_e) {}
        }
        mod.AddUIText(
            "OnPointCountText",
            mod.CreateVector(0, ONPOINT_COUNT_Y, 0),
            mod.CreateVector(120, 20, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const count = findWidget("OnPointCountText");
        if (count) {
            try {
                mod.SetUITextColor(count, HUD_TEXT_COLOR);
                mod.SetUITextSize(count, 14);
                mod.SetUITextAnchor(count, mod.UIAnchor.Center);
                mod.SetUIWidgetBgAlpha(count, 0);
                mod.SetUIWidgetVisible(count, false);
            } catch (_e) {}
        }
        mod.AddUIText(
            "OnPointBarBg",
            mod.CreateVector(0, ONPOINT_BAR_Y, 0),
            mod.CreateVector(ONPOINT_BAR_W, ONPOINT_BAR_H, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const bg = findWidget("OnPointBarBg");
        if (bg) {
            try {
                mod.SetUIWidgetBgColor(bg, mod.CreateVector(0.2, 0.2, 0.2));
                mod.SetUIWidgetBgAlpha(bg, 0.8);
                mod.SetUIWidgetBgFill(bg, mod.UIBgFill.Solid);
                mod.SetUIWidgetVisible(bg, false);
            } catch (_e) {}
        }
        mod.AddUIText(
            "OnPointBarFill",
            mod.CreateVector(0, ONPOINT_BAR_Y, 0),
            mod.CreateVector(1, ONPOINT_BAR_H, 0),
            mod.UIAnchor.TopCenter,
            mod.Message("{}", "")
        );
        const fill = findWidget("OnPointBarFill");
        if (fill) {
            try {
                mod.SetUIWidgetBgColor(fill, TEAM1_COLOR);
                mod.SetUIWidgetBgAlpha(fill, 0.95);
                mod.SetUIWidgetBgFill(fill, mod.UIBgFill.Solid);
                mod.SetUIWidgetVisible(fill, false);
            } catch (_e) {}
        }
    }
    export function HUD_flashTeamScore(teamId: number): void {
        const until = mod.GetMatchTimeElapsed() + TICKET_FLASH_DURATION;
        if (teamId === 1) ticketFlashEnd1 = Math.max(ticketFlashEnd1, until);
        else if (teamId === 2) ticketFlashEnd2 = Math.max(ticketFlashEnd2, until);
    }
    export function HUD_setRoundTimer(secondsRemaining: number, inOvertime: boolean): void {
        if (!setRoundTimerState) return;
        const totalSeconds = Math.max(0, Math.floor(secondsRemaining));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setRoundTimerState({
            visible: true,
            minutes,
            seconds,
            stateText: inOvertime ? "OVERTIME" : "",
            stateColor: inOvertime ? CONTESTED_COLOR : HUD_TEXT_COLOR,
        });
    }
}


// Module: modules/WorldIconModule.ts
namespace ConquestV8 {
    const TEAM1_HQ_ICON_OBJID = 1502;
    const TEAM2_HQ_ICON_OBJID = 1503;
    const BLUE_COLOR = mod.CreateVector(0.443, 0.918, 0.996);   // NATO cyan #71EAFE
    const RED_COLOR = mod.CreateVector(1.0, 0.529, 0.396);      // PAX orange #FF8765
    let matchCount = 0;
    let team1Icon: mod.WorldIcon | null = null;
    let team2Icon: mod.WorldIcon | null = null;
    export function initWorldIconModule(): void {
        matchCount++;
        log(`[ConquestV10][WorldIcon] Initializing (match #${matchCount})`);
        safeCall("WorldIcon:GetTeam1", () => {
            team1Icon = mod.GetWorldIcon(TEAM1_HQ_ICON_OBJID);
        });
        safeCall("WorldIcon:GetTeam2", () => {
            team2Icon = mod.GetWorldIcon(TEAM2_HQ_ICON_OBJID);
        });
        if (!team1Icon || !team2Icon) {
            log(`[ConquestV10][WorldIcon] WARNING: Could not find HQ icons (T1=${team1Icon ? "OK" : "MISSING"}, T2=${team2Icon ? "OK" : "MISSING"})`);
            return;
        }
        const team1Faction = getTeamFaction(1);
        const team2Faction = getTeamFaction(2);
        const team1Color = team1Faction === mod.Factions.PaxArmata ? RED_COLOR : BLUE_COLOR;
        const team2Color = team2Faction === mod.Factions.PaxArmata ? RED_COLOR : BLUE_COLOR;
        safeCall("WorldIcon:Team1", () => {
            if (team1Icon) mod.SetWorldIconColor(team1Icon, team1Color);
        });
        safeCall("WorldIcon:Team2", () => {
            if (team2Icon) mod.SetWorldIconColor(team2Icon, team2Color);
        });
        log(`[ConquestV10][WorldIcon] Colors by faction (match #${matchCount}) - T1=${getTeamFactionLabel(1)}, T2=${getTeamFactionLabel(2)}`);
    }
}


// Module: modules/ZiplineModule.ts
namespace ConquestV8 {
    const ELEVATOR_CONFIGS: { ipId: number; targetY: number; label: string }[] = [
        { ipId: 100, targetY: 75.6, label: "Ruin_H07BD" },       // Zipline  - OutskirtsHouseMedium_07
        { ipId: 101, targetY: 83.5, label: "Ruin_H06BD" },       // Zipline2 - OutskirtsHouseMedium_06
        { ipId: 102, targetY: 67.6, label: "Ruin_H04BD" },       // OutskirtsHouseMedium_04 (ruin)
        { ipId: 103, targetY: 59.6, label: "Set_H03" },          // OutskirtsHouseMedium_03
        { ipId: 104, targetY: 74.4, label: "Vil_H07" },          // OutskirtsHouseMedium_05
        { ipId: 105, targetY: 76.9, label: "Vil_H05" },          // OutskirtsHouseMedium_05
        { ipId: 107, targetY: 66.6, label: "Vil_H06" },          // OutskirtsHouseMedium_04
        { ipId: 108, targetY: 68.7, label: "Vil_H04" },          // OutskirtsHouseMedium_04
    ];
    const ELEVATOR_SPEED_MPS = 5.0;
    const ELEVATOR_MOVER_PREFAB = mod.RuntimeSpawn_Common.CinderblockStack_01_A_60;
    const ELEVATOR_MOVER_SCALE = mod.CreateVector(8, 1, 8);
    const ELEVATOR_SPAWN_Y_OFFSET = -1.5;
    const ELEVATOR_SETTLE_SECONDS = 0.5;
    const ELEVATOR_LINGER_SECONDS = 2.0;
    const ELEVATOR_DEBUG = true;
    const ELEVATOR_ZERO = mod.CreateVector(0, 0, 0);
    const ELEVATOR_SFX_PREFAB = mod.RuntimeSpawn_Common.SFX_Levels_Cairo_SP_NightRaid_Spots_RopeStress_OneShot3D;
    const ELEVATOR_SFX_AMPLITUDE = 1.0;
    const ELEVATOR_SFX_ATTENUATION = 10;
    interface ElevatorState {
        ipId: number;
        targetY: number;
        label: string;
        interactPoint: mod.InteractPoint;
        activeMover: mod.Object | null;
        activePlayerId: number | null;
        isMoving: boolean;
        moveToken: number;
        sfx: mod.SFX | null;
    }
    let elevatorInitialized = false;
    const elevatorStates: Map<number, ElevatorState> = new Map();  // ipId -> state
    export function initZiplineModule(): void {
        if (elevatorInitialized) return;
        for (const cfg of ELEVATOR_CONFIGS) {
            try {
                const ip = mod.GetInteractPoint(cfg.ipId);
                if (!ip) {
                    log(`[Elevator] InteractPoint ${cfg.ipId} not found - skipping ${cfg.label}`);
                    continue;
                }
                mod.EnableInteractPoint(ip, true);
                let sfx: mod.SFX | null = null;
                try { sfx = mod.SpawnObject(ELEVATOR_SFX_PREFAB, ELEVATOR_ZERO, ELEVATOR_ZERO) as mod.SFX; } catch (_e) {}
                const state: ElevatorState = {
                    ipId: cfg.ipId,
                    targetY: cfg.targetY,
                    label: cfg.label,
                    interactPoint: ip,
                    activeMover: null,
                    activePlayerId: null,
                    isMoving: false,
                    moveToken: 0,
                    sfx,
                };
                elevatorStates.set(cfg.ipId, state);
                log(`[Elevator] Ready: ${cfg.label} (IP=${cfg.ipId}) targetY=${cfg.targetY}`);
            } catch (e) {
                log(`[Elevator] Failed to init ${cfg.label} (IP=${cfg.ipId}): ${e}`);
            }
        }
        elevatorInitialized = true;
        log(`[Elevator] Module initialized: ${elevatorStates.size} elevators active`);
    }
    export function resetZiplineModule(): void {
        for (const [_id, state] of elevatorStates) {
            if (state.activeMover) {
                try { mod.UnspawnObject(state.activeMover); } catch (_e) {}
                state.activeMover = null;
            }
            if (state.sfx) {
                try { mod.StopSound(state.sfx); } catch (_e) {}
                try { mod.UnspawnObject(state.sfx); } catch (_e) {}
            }
        }
        elevatorStates.clear();
        elevatorInitialized = false;
    }
    export function Zipline_OnPlayerEnterAreaTrigger(_player: mod.Player, _areaTrigger: mod.AreaTrigger): void {}
    export function Zipline_OnPlayerExitAreaTrigger(_player: mod.Player, _areaTrigger: mod.AreaTrigger): void {}
    export function Zipline_OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint): void {
        if (!elevatorInitialized) return;
        for (const [_id, st] of elevatorStates) {
            try { mod.EnableInteractPoint(st.interactPoint, true); } catch (_e) {}
        }
        let ipId: number;
        let playerId: number;
        try {
            ipId = mod.GetObjId(interactPoint);
            playerId = mod.GetObjId(player);
        } catch (_e) { return; }
        const state = elevatorStates.get(ipId);
        if (!state) return;
        if (state.isMoving) {
            if (ELEVATOR_DEBUG) log(`[Elevator] ${state.label} is busy`);
            return;
        }
        log(`[Elevator] Player ${playerId} activating ${state.label}`);
        startAscent(state, player, playerId);
    }
    export function Zipline_OnPlayerLeaveGame(playerId: number): void {
        clearActiveRider(playerId);
    }
    export function Zipline_OnPlayerUndeploy(player: mod.Player): void {
        let playerId: number;
        try { playerId = mod.GetObjId(player); } catch (_e) { return; }
        clearActiveRider(playerId);
    }
    function startAscent(state: ElevatorState, rider: mod.Player, playerId: number): void {
        if (state.activeMover) {
            try { mod.UnspawnObject(state.activeMover); } catch (_e) {}
            state.activeMover = null;
        }
        let riderPos: mod.Vector;
        try {
            riderPos = mod.GetSoldierState(rider, mod.SoldierStateVector.GetPosition);
        } catch (e) {
            log(`[Elevator] Failed to get rider position: ${e}`);
            return;
        }
        const riderX = mod.XComponentOf(riderPos);
        const riderY = mod.YComponentOf(riderPos);
        const riderZ = mod.ZComponentOf(riderPos);
        const deltaY = state.targetY - riderY;
        if (deltaY < 1.0) {
            log(`[Elevator] Already at roof for ${state.label}`);
            return;
        }
        const ascentDuration = deltaY / ELEVATOR_SPEED_MPS;
        const spawnPos = mod.CreateVector(riderX, riderY + ELEVATOR_SPAWN_Y_OFFSET, riderZ);
        let mover: mod.Object;
        try {
            mover = mod.SpawnObject(
                ELEVATOR_MOVER_PREFAB,
                spawnPos,
                ELEVATOR_ZERO,
                ELEVATOR_MOVER_SCALE
            ) as mod.Object;
            mod.GetObjId(mover); // validate spawn
        } catch (e) {
            log(`[Elevator] Failed to spawn mover for ${state.label}: ${e}`);
            return;
        }
        log(`[Elevator] Mover spawned for ${state.label}: rider=(${riderX.toFixed(1)},${riderY.toFixed(1)},${riderZ.toFixed(1)}), ` +
            `moverY=${(riderY + ELEVATOR_SPAWN_Y_OFFSET).toFixed(1)}, deltaY=${deltaY.toFixed(1)}, duration=${ascentDuration.toFixed(1)}s`);
        const moveToken = ++state.moveToken;
        state.activeMover = mover;
        state.activePlayerId = playerId;
        state.isMoving = true;
        void (async () => {
            await mod.Wait(ELEVATOR_SETTLE_SECONDS);
            if (state.moveToken !== moveToken) return;
            mod.MoveObjectOverTime(
                mover,
                mod.CreateVector(0, deltaY, 0),
                ELEVATOR_ZERO,
                ascentDuration,
                false,
                false
            );
            log(`[Elevator] Ascending ${state.label}: ${deltaY.toFixed(1)}m at ${ELEVATOR_SPEED_MPS} m/s (${ascentDuration.toFixed(1)}s)`);
            if (state.sfx) {
                try { mod.PlaySound(state.sfx, ELEVATOR_SFX_AMPLITUDE, riderPos, ELEVATOR_SFX_ATTENUATION); } catch (_e) {}
            }
            await mod.Wait(ascentDuration);
            if (state.moveToken !== moveToken) return;
            log(`[Elevator] ${state.label} reached top - lingering ${ELEVATOR_LINGER_SECONDS}s`);
            await mod.Wait(ELEVATOR_LINGER_SECONDS);
            if (state.moveToken !== moveToken) return;
            log(`[Elevator] ${state.label} ride complete, unspawning mover`);
            if (state.activeMover) {
                try { mod.UnspawnObject(state.activeMover); } catch (_e) {}
                state.activeMover = null;
            }
            state.activePlayerId = null;
            state.isMoving = false;
        })();
    }
    function clearActiveRider(playerId: number): void {
        for (const [_id, state] of elevatorStates) {
            if (state.activePlayerId === playerId) {
                state.activePlayerId = null;
            }
        }
    }
}


// Module: modules/IntroModule.ts
namespace ConquestV8 {
    const INTRO_CAMERA_ID = 5000;
    let introComplete = false;
    export let introCamera: mod.FixedCamera | null = null;
    export let hq1: mod.HQ | null = null;
    export let hq2: mod.HQ | null = null;
    export function Intro_Init(): void {
        introComplete = true;
        try {
            hq1 = mod.GetHQ(0);
            if (hq1) mod.SetHQTeam(hq1, mod.GetTeam(1));
        } catch (_) {}
        try {
            hq2 = mod.GetHQ(1);
            if (hq2) mod.SetHQTeam(hq2, mod.GetTeam(2));
        } catch (_) {}
        try {
            introCamera = mod.GetFixedCamera(INTRO_CAMERA_ID);
            if (introCamera) {
                log(`[Intro] FixedCamera acquired (id=${INTRO_CAMERA_ID})`);
            }
        } catch (e) {
            log(`[Intro] FixedCamera error: ${e}`);
            introCamera = null;
        }
        log("[Intro] HQ teams set, intro disabled");
    }
    export function Intro_IsComplete(): boolean { return introComplete; }
    export function Intro_IsRunning(): boolean { return false; }
}


// Module: modules/FlightRecorderModule.ts
namespace ConquestV8 {
    const RECORD_INTERVAL = 0.5;  // seconds between samples
    const RECORD_TAG = "[FLYREC]"; // unique tag for Python parser
    let recorderActive = false;
    let sampleIndex = 0;
    let lastRecordTime = 0;
    let followActive = false;
    const DEG2RAD = Math.PI / 180;
    export function FlightRecorder_Init(): void {
        if (FLIGHT_RECORDER_ENABLED) {
            recorderActive = false;
            sampleIndex = 0;
            lastRecordTime = 0;
            log("[FlightRecorder] Module ready - waiting for human to enter vehicle");
            log("[FlightRecorder] AI bots will remain idle for scenery");
        }
        if (FOLLOW_CAMERA_ENABLED) {
            followActive = false;
            log("[FollowCamera] Module ready - will attach to human player after deploy");
        }
    }
    export function FlightRecorder_OnEnterVehicle(player: mod.Player): void {
        if (!FLIGHT_RECORDER_ENABLED) return;
        log(`${RECORD_TAG} OnEnterVehicle called`);
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            if (isAI) {
                log(`${RECORD_TAG} Skipping AI player`);
                return;
            }
        } catch (e) {
            log(`${RECORD_TAG} WARNING: IsAISoldier check failed: ${e} - attempting to record anyway`);
        }
        recorderActive = true;
        sampleIndex = 0;
        lastRecordTime = 0;
        log(`${RECORD_TAG} === RECORDING START ===`);
        log(`${RECORD_TAG} Map: ${getCurrentMapName()}`);
        log(`${RECORD_TAG} Interval: ${RECORD_INTERVAL}s`);
        recordSample(player);
    }
    export function FlightRecorder_OnExitVehicle(player: mod.Player): void {
        if (!FLIGHT_RECORDER_ENABLED || !recorderActive) return;
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            if (isAI) return;
        } catch (_) { return; }
        log(`${RECORD_TAG} === RECORDING STOP === (${sampleIndex} samples)`);
        recorderActive = false;
    }
    export function FlightRecorder_OnPlayerDied(player: mod.Player): void {
        if (!FLIGHT_RECORDER_ENABLED || !recorderActive) return;
        try {
            const isAI = mod.GetSoldierState(player, mod.SoldierStateBool.IsAISoldier);
            if (isAI) return;
        } catch (_) { return; }
        log(`${RECORD_TAG} === RECORDING STOP (CRASH) === (${sampleIndex} samples)`);
        recorderActive = false;
    }
    export function FlightRecorder_Tick(dt: number): void {
        if (FOLLOW_CAMERA_ENABLED) {
            followCameraTick();
        }
        if (!FLIGHT_RECORDER_ENABLED) return;
        lastRecordTime += dt;
        if (lastRecordTime < RECORD_INTERVAL) return;
        lastRecordTime = 0;
        try {
            const players = mod.AllPlayers();
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p || !mod.IsPlayerValid(p)) continue;
                try {
                    const isAI = mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier);
                    if (isAI) continue;
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    if (!recorderActive && inVehicle) {
                        log(`${RECORD_TAG} === RECORDING START (TICK FALLBACK) ===`);
                        log(`${RECORD_TAG} Map: ${getCurrentMapName()}`);
                        log(`${RECORD_TAG} Interval: ${RECORD_INTERVAL}s`);
                        recorderActive = true;
                        sampleIndex = 0;
                        recordSample(p);
                        return;
                    }
                    if (recorderActive && !inVehicle) {
                        log(`${RECORD_TAG} === RECORDING STOP (LEFT VEHICLE) === (${sampleIndex} samples)`);
                        recorderActive = false;
                        return;
                    }
                    if (recorderActive && inVehicle) {
                        recordSample(p);
                    }
                    return;
                } catch (_) {}
            }
        } catch (_) {}
    }
    export function FlightRecorder_ShouldKeepIdle(): boolean {
        return FLIGHT_RECORDER_ENABLED;
    }
    function followCameraStart(): void {
        if (followActive || !introCamera) return;
        try {
            mod.SetCameraTypeForAll(mod.Cameras.Fixed, 5000);
            followActive = true;
            log("[FollowCamera] Attached to FixedCamera");
        } catch (e) {
            log(`[FollowCamera] Failed to set Fixed camera: ${e}`);
        }
    }
    function followCameraTick(): void {
        if (!introCamera) return;
        try {
            const players = mod.AllPlayers();
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const p = mod.ValueInArray(players, i) as mod.Player;
                if (!p || !mod.IsPlayerValid(p)) continue;
                try {
                    const isAI = mod.GetSoldierState(p, mod.SoldierStateBool.IsAISoldier);
                    if (isAI) continue;
                    const testPos = mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
                    if (!testPos) continue;
                    if (!followActive) followCameraStart();
                    const inVehicle = mod.GetSoldierState(p, mod.SoldierStateBool.IsInVehicle);
                    let px: number, py: number, pz: number;
                    let facingX: number, facingZ: number;
                    if (inVehicle) {
                        const vehicle = mod.GetVehicleFromPlayer(p);
                        const vPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
                        const vFace = mod.GetVehicleState(vehicle, mod.VehicleStateVector.FacingDirection);
                        px = mod.XComponentOf(vPos);
                        py = mod.YComponentOf(vPos);
                        pz = mod.ZComponentOf(vPos);
                        facingX = mod.XComponentOf(vFace);
                        facingZ = mod.ZComponentOf(vFace);
                    } else {
                        const sPos = mod.GetSoldierState(p, mod.SoldierStateVector.GetPosition);
                        const sFace = mod.GetSoldierState(p, mod.SoldierStateVector.GetFacingDirection);
                        px = mod.XComponentOf(sPos);
                        py = mod.YComponentOf(sPos);
                        pz = mod.ZComponentOf(sPos);
                        facingX = mod.XComponentOf(sFace);
                        facingZ = mod.ZComponentOf(sFace);
                    }
                    const facingDist = Math.sqrt(facingX * facingX + facingZ * facingZ);
                    const normX = facingDist > 0.01 ? facingX / facingDist : 0;
                    const normZ = facingDist > 0.01 ? facingZ / facingDist : 1;
                    const camX = px - normX * FOLLOW_CAMERA_DISTANCE;
                    const camY = py + FOLLOW_CAMERA_HEIGHT;
                    const camZ = pz - normZ * FOLLOW_CAMERA_DISTANCE;
                    const camYaw = Math.atan2(facingX, facingZ); // radians
                    const camPitch = FOLLOW_CAMERA_PITCH * DEG2RAD;
                    mod.SetObjectTransform(introCamera, mod.CreateTransform(
                        mod.CreateVector(camX, camY, camZ),
                        mod.CreateVector(camPitch, camYaw, 0)
                    ));
                    return; // Found human, done
                } catch (_) {}
            }
        } catch (_) {}
    }
    function recordSample(player: mod.Player): void {
        try {
            const vehicle = mod.GetVehicleFromPlayer(player);
            const vehPos = mod.GetVehicleState(vehicle, mod.VehicleStateVector.VehiclePosition);
            const vehFacing = mod.GetVehicleState(vehicle, mod.VehicleStateVector.FacingDirection);
            const px = mod.XComponentOf(vehPos);
            const py = mod.YComponentOf(vehPos);
            const pz = mod.ZComponentOf(vehPos);
            const fx = mod.XComponentOf(vehFacing);
            const fy = mod.YComponentOf(vehFacing);
            const fz = mod.ZComponentOf(vehFacing);
            const yaw = Math.atan2(fx, fz) * (180 / Math.PI);
            const horizDist = Math.sqrt(fx * fx + fz * fz);
            const pitch = Math.atan2(fy, horizDist) * (180 / Math.PI);
            const line = `${RECORD_TAG} S ${sampleIndex} ${r(px)} ${r(py)} ${r(pz)} ${r(pitch)} ${r(yaw)}`;
            console.log(line);
            sampleIndex++;
        } catch (e) {
            log(`${RECORD_TAG} Sample error: ${e}`);
        }
    }
    function r(n: number): string {
        return (Math.round(n * 10) / 10).toString();
    }
}


// Module: modules/ColourFilterModule.ts
namespace ConquestV8 {
    const CF_CONTAINER = "CF_Root";
    let filterApplied = false;
    export function ColourFilter_Apply(): void {
        if (COLOUR_FILTER_MODE === 'none') return;
        if (filterApplied) return;
        filterApplied = true;
        try {
            mod.AddUIContainer(
                CF_CONTAINER,
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(10000, 10000, 0),
                mod.UIAnchor.TopCenter
            );
            const root = mod.FindUIWidgetWithName(CF_CONTAINER);
            if (!root) return;
            mod.SetUIWidgetDepth(root, mod.UIDepth.BelowGameUI);
            let bgColor: mod.Vector;
            let bgAlpha: number;
            let bgFill: mod.UIBgFill;
            if (COLOUR_FILTER_MODE === 'bf3') {
                bgColor = mod.CreateVector(0, 0.8, 1.0);
                bgAlpha = 0.2;
                bgFill = mod.UIBgFill.Blur;
            } else if (COLOUR_FILTER_MODE === 'bf4') {
                bgColor = mod.CreateVector(1.0, 0.5, 0);
                bgAlpha = 0.2;
                bgFill = mod.UIBgFill.Blur;
            } else {
                bgColor = mod.CreateVector(0, 0.3, 0.5);
                bgAlpha = 0.15;
                bgFill = mod.UIBgFill.Solid;
            }
            mod.AddUIText(
                "CF_Overlay",
                mod.CreateVector(0, 0, 0),
                mod.CreateVector(10000, 10000, 0),
                mod.UIAnchor.TopCenter,
                root,
                true,
                0,
                bgColor,
                bgAlpha,
                bgFill,
                mod.Message("{}", ""),
                12,
                mod.CreateVector(0, 0, 0),
                0,
                mod.UIAnchor.Center,
                mod.UIDepth.BelowGameUI
            );
            log("[ColourFilter] Applied mode: " + COLOUR_FILTER_MODE);
        } catch (e) {
            log("[ColourFilter] Apply failed: " + e);
        }
    }
    export function ColourFilter_Remove(): void {
        if (!filterApplied) return;
        filterApplied = false;
        try {
            const root = mod.FindUIWidgetWithName(CF_CONTAINER);
            if (root) mod.DeleteUIWidget(root);
        } catch (_e) {}
    }
}


// Module: main.script.ts
namespace ConquestV8 {
    let running = false;
    let runToken = 0;
    let vehicleUIEnabled = false;  // set at round start via auto-detection
    let lowTicketMusicTriggered = false;  // V13: overtime music trigger flag
    let overtimeActive = false;
    const LOW_TICKET_MUSIC_THRESHOLD = Math.floor(STARTING_TICKETS * 0.25);
    const QUOTA_AUTOEND_ENABLED = true;
    const QUOTA_CHECK_DELAY_SECONDS = 15.0;   // Wait for spawning to complete
    const QUOTA_THRESHOLD_PERCENT = 0.60;     // Auto-end if < 60% of target bots
    const TARGET_BOTS_PER_TEAM = 31;          // Expected full quota (sync with SpawnRecycle)
    let quotaCheckPerformed = false;          // Only check once per match
    export function OnGameModeStarted(): void {
        try { mod.EnableAllPlayerDeploy(false); } catch (_) {}
        const currentPortalRound = Registry_IncrementPortalRoundNumber();
        quotaCheckPerformed = false;
        log("==".repeat(30));
        log(`Conquest V14 Starting - Build ${BUILD_ID}`);
        log(`Portal Round: ${currentPortalRound}`);
        log("V14: TotalControl bonus, kill assists, ParseUI HUD, colour filter");
        if (QUOTA_AUTOEND_ENABLED) {
            log(`[QUOTA] Will check bot population after ${QUOTA_CHECK_DELAY_SECONDS}s`);
        }
        log("=".repeat(60));
        running = false;
        runToken++;
        Registry_Reset();
        Objective_Reset();
        CapturePoint_Reset();
        SpawnRecycle_Reset();  // TRUE RECYCLING - handles both initial spawns and recycling
        ObjectiveBias_Reset();
        Director_Reset();
        Ticket_Reset();
        resetFactionCache();
        lowTicketMusicTriggered = false;  // V13: reset overtime music flag
        overtimeActive = false;
        Registry_SetRoundStartTime(mod.GetMatchTimeElapsed());
        Registry_SetRoundState(RoundState.PreRound);
        initializeMapConfig();
        Objective_Init();
        CapturePoint_Init();
        CapturePoint_EnableAll();
        SpawnRecycle_Init();  // Handles initial spawns AND recycling (replaces AISpawnModule)
        ObjectiveBias_Init();
        Director_Init();
        Ticket_Init();
        initHudParseUI();
        startHudParseUI();
        initScoreboardModule();
        initSoundsModule();
        initVehicleDirector();
        for (const reward of CAPTURE_REWARDS) {
            try {
                const spawner = mod.GetVehicleSpawner(reward.spawnerObjId);
                if (spawner) {
                    mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                    mod.SetVehicleSpawnerApplyDamageToAbandonVehicle(spawner, true);
                    mod.SetVehicleSpawnerAbandonVehiclesOutOfCombatArea(spawner, true);
                    mod.SetVehicleSpawnerTimeUntilAbandon(spawner, 20);
                    mod.SetVehicleSpawnerKeepAliveAbandonRadius(spawner, 50);
                    mod.SetVehicleSpawnerKeepAliveSpawnerRadius(spawner, 50);
                    log(`[CaptureReward] Spawner ${reward.spawnerObjId} fully initialized (${reward.label}) - AutoSpawn OFF, abandonment configured`);
                } else {
                    log(`[CaptureReward] WARNING: GetVehicleSpawner(${reward.spawnerObjId}) returned null`);
                }
            } catch (e) {
                log(`[CaptureReward] FAILED to init spawner ${reward.spawnerObjId}: ${e}`);
            }
        }
        const vehicleCount = mod.CountOf(mod.AllVehicles());
        vehicleUIEnabled =
            VEHICLE_UI_MODE === 'on' ||
            (VEHICLE_UI_MODE === 'auto' && vehicleCount > 0);
        log(`[VehicleUI] ${vehicleCount} vehicle(s) detected - UI ${vehicleUIEnabled ? 'ENABLED' : 'DISABLED'}`);
        if (vehicleUIEnabled) initVehicleSpawnUI();
        initWorldIconModule();
        initZiplineModule();
        Intro_Init();  // HQ team setup + FixedCamera acquisition
        FlightRecorder_Init();  // V14: Flight path recorder + follow camera
        if (mod.IsCurrentMap(mod.Maps.Badlands)) {
            const BADLANDS_WINTER_VFX_IDS = [4001, 4002, 4004, 4005, 4006, 4007, 4019, 4020, 4021, 4022, 4023, 4024, 4025, 4026, 4027, 4028, 4029, 4030, 4031, 4032, 4033, 4034, 4035, 4036];
            for (const vfxId of BADLANDS_WINTER_VFX_IDS) {
                try {
                    const vfx = mod.GetVFX(vfxId);
                    if (vfx) {
                        mod.EnableVFX(vfx, true);
                        log(`[VFX] Enabled Badlands winter VFX id=${vfxId}`);
                    }
                } catch (e) {
                    log(`[VFX] Failed to enable Badlands winter VFX id=${vfxId}: ${e}`);
                }
            }
        }
        running = true;
        const token = runToken;
        tickLoop(token);
    }
    async function tickLoop(token: number): Promise<void> {
        while (running && token === runToken) {
            const currentTime = mod.GetMatchTimeElapsed();
            const roundState = Registry_GetRoundState();
            if (roundState === RoundState.PreRound) {
                safeCall("SpawnRecycle_Start", () => SpawnRecycle_Start());
                safeCall("SpawnRecycle_Tick", () => SpawnRecycle_Tick()); // Process spawn batches!
                safeCall("VehicleDirector:PreRound", () => VehicleDirector_PreRoundTick());
                const stats = SpawnRecycle_GetStats();
                if (stats.team1Alive > 0 && stats.team2Alive > 0) {
                    log("Pre-round spawn complete - transitioning to active!");
                    log(`[SpawnRecycle] Initial bots: T1=${stats.team1Alive} T2=${stats.team2Alive}`);
                    Registry_SetRoundState(RoundState.Active);
                    try { mod.EnableAllPlayerDeploy(true); } catch (_) {}
                    if (!FlightRecorder_ShouldKeepIdle()) {
                        safeCall("ActivateBots", () => SpawnRecycle_ActivateAllBots());
                    } else {
                        log("[FlightRecorder] Bots kept idle for recording scenery");
                    }
                    safeCall("ColourFilter", () => ColourFilter_Apply());
                    safeCall("SoundsStart", () => Sounds_playMatchStart());
                    safeCall("FirstSpawnVO", () => Sounds_playFirstSpawnVO());
                    log("Pre-round complete - Round started!");
                }
            } else if (roundState === RoundState.Active) {
                safeCall("SpawnRecycle", () => SpawnRecycle_Tick());
                safeCall("FlightRecorder", () => FlightRecorder_Tick(TICK_INTERVAL_SECONDS));
                safeCall("Objective", () => Objective_Tick());
                safeCall("ObjectiveBias", () => ObjectiveBias_Tick(currentTime));
                safeCall("Director", () => Director_Tick(currentTime));
                safeCall("Ticket", () => Ticket_Tick());
                safeCall("Scoreboard", () => tickScoreboard());
                safeCall("VehicleDirector", () => tickVehicleDirector());
                safeCall("CaptureRewardSpawn", () => tickCaptureRewardSpawns());
                if (vehicleUIEnabled) safeCall("VehicleSpawnUI", () => tickVehicleUI());
                if (!lowTicketMusicTriggered) {
                    const t1 = getTickets(1);
                    const t2 = getTickets(2);
                    if (t1 <= LOW_TICKET_MUSIC_THRESHOLD || t2 <= LOW_TICKET_MUSIC_THRESHOLD) {
                        lowTicketMusicTriggered = true;
                        log(`[Sounds] Low-ticket music threshold hit: T1=${t1} T2=${t2} threshold=${LOW_TICKET_MUSIC_THRESHOLD}`);
                        safeCall("SoundsOvertime", () => Sounds_triggerOvertimeMusic());
                    }
                }
                safeCall("Sounds", () => {
                    const cps = mod.AllCapturePoints();
                    const count = mod.CountOf(cps);
                    for (let i = 0; i < count; i++) {
                        const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                        if (cp) {
                            Sounds_notifyCaptureStatus(cp);
                            Sounds_notifyCaptureTick(cp);
                        }
                    }
                });
                safeCall("SoundsStartRetry", () => Sounds_tickEarlyRoundMusic(currentTime));
                safeCall("SoundsProgress", () => Sounds_tickMatchProgress());
                safeCall("SoundsDynMusic", () => Sounds_tickDynamicMusic());
                safeCall("SoundsLowTicket", () => Sounds_tickLowTicketVO());
                safeCall("SoundsAmbient", () => Sounds_tickMapAmbience(currentTime));
                if (OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS) {
                    const elapsed = currentTime - Registry_GetRoundStartTime();
                    const remaining = OVERRIDE_GAMEMODE_TIME_LIMIT_SECONDS - elapsed;
                    safeCall("HUDTimer", () => HUD_setRoundTimer(Math.max(0, remaining), overtimeActive));
                    safeCall("SoundsTime", () => Sounds_tickTimeWarnings(Math.max(0, remaining)));
                    safeCall("SoundsTimeCrit", () => Sounds_tickTimeCriticalVO(Math.max(0, remaining)));
                    if (!overtimeActive && remaining <= 0) {
                        if (isOvertimeCaptureActive()) {
                            overtimeActive = true;
                            log("[Overtime] Triggered at time expiry - active capture still in progress");
                            safeCall("SoundsOvertimeVO", () => Sounds_playOvertimeVO());
                            if (!lowTicketMusicTriggered) {
                                lowTicketMusicTriggered = true;
                                safeCall("SoundsOvertime", () => Sounds_triggerOvertimeMusic());
                            }
                        } else {
                            endRound(determineTimeLimitWinner());
                            break;
                        }
                    } else if (overtimeActive && !isOvertimeCaptureActive()) {
                        log("[Overtime] Capture resolved - ending round");
                        endRound(determineTimeLimitWinner());
                        break;
                    }
                }
                const winner = Ticket_CheckWinCondition();
                if (winner !== 0) {
                    endRound(winner);
                    break;
                }
                if (QUOTA_AUTOEND_ENABLED && !quotaCheckPerformed) {
                    const roundElapsed = currentTime - Registry_GetRoundStartTime();
                    if (roundElapsed >= QUOTA_CHECK_DELAY_SECONDS) {
                        quotaCheckPerformed = true; // Only check once
                        const stats = SpawnRecycle_GetStats();
                        const totalBots = stats.team1Total + stats.team2Total;
                        const expectedBots = TARGET_BOTS_PER_TEAM * 2;
                        const ratio = totalBots / expectedBots;
                        log(`[QUOTA] Bot check: ${totalBots}/${expectedBots} (${(ratio * 100).toFixed(0)}%)`);
                        if (ratio < QUOTA_THRESHOLD_PERCENT) {
                            log(`[QUOTA] Below threshold (${(QUOTA_THRESHOLD_PERCENT * 100).toFixed(0)}%) - auto-ending`);
                            log(`[QUOTA] Next round will have full AI quota - starting real match`);
                            const obj1 = Objective_GetOwnedCount(1);
                            const obj2 = Objective_GetOwnedCount(2);
                            const autoWinner = obj1 >= obj2 ? 1 : 2;
                            endRound(autoWinner);
                            break;
                        } else {
                            log(`[QUOTA] Full quota available - continuing match normally`);
                        }
                    }
                }
            }
            await mod.Wait(TICK_INTERVAL_SECONDS);
        }
    }
    function endRound(winningTeam: number): void {
        running = false;
        overtimeActive = false;
        Registry_SetRoundState(RoundState.Ending);
        if (winningTeam === 0) log("Round ended - Draw");
        else log("Round ended - Team " + winningTeam + " wins!");
        if (ENABLE_WIN_CONDITION_LOGS) {
            const t1 = getTickets(1);
            const t2 = getTickets(2);
            const o1 = Objective_GetOwnedCount(1);
            const o2 = Objective_GetOwnedCount(2);
            log(`[WinCondition] endRound winner=${winningTeam} t1=${t1} t2=${t2} o1=${o1} o2=${o2}`);
        }
        if (winningTeam !== 0) safeCall("SoundsEOM", () => Sounds_playMatchEnd(winningTeam));
        if (winningTeam === 0) {
            const drawTeam = mod.GetTeam(0);
            if (drawTeam) mod.EndGameMode(drawTeam);
            return;
        }
        const team = mod.GetTeam(winningTeam);
        if (team) {
            mod.EndGameMode(team);
        }
    }
    function getPointPresence(cp: mod.CapturePoint): { team1: number; team2: number } {
        let team1 = 0;
        let team2 = 0;
        try {
            const players = mod.GetPlayersOnPoint(cp);
            const count = mod.CountOf(players);
            for (let i = 0; i < count; i++) {
                const player = mod.ValueInArray(players, i) as mod.Player;
                if (!player) continue;
                const teamId = getPlayerTeamId(player);
                if (teamId === 1) team1++;
                else if (teamId === 2) team2++;
            }
        } catch (_e) {}
        return { team1, team2 };
    }
    function isOvertimeCaptureActive(): boolean {
        try {
            const cps = mod.AllCapturePoints();
            const count = mod.CountOf(cps);
            for (let i = 0; i < count; i++) {
                const cp = mod.ValueInArray(cps, i) as mod.CapturePoint;
                if (!cp) continue;
                const presence = getPointPresence(cp);
                const contested = presence.team1 > 0 && presence.team2 > 0;
                if (contested) return true;
                let progress = 0;
                try {
                    progress = Math.max(0, Math.min(1, mod.GetCaptureProgress(cp)));
                } catch (_e) {}
                let progressTeamId = 0;
                try {
                    progressTeamId = mod.GetObjId(mod.GetOwnerProgressTeam(cp));
                } catch (_e) {
                    progressTeamId = 0;
                }
                if (progressTeamId !== 0 && progress > 0.01) return true;
            }
        } catch (_e) {}
        return false;
    }
    function determineTimeLimitWinner(): number {
        const t1 = getTickets(1);
        const t2 = getTickets(2);
        if (t1 > t2) return 1;
        if (t2 > t1) return 2;
        const o1 = Objective_GetOwnedCount(1);
        const o2 = Objective_GetOwnedCount(2);
        if (o1 > o2) return 1;
        if (o2 > o1) return 2;
        return 0;
    }
    function safeCall(label: string, fn: () => void): void {
        try {
            fn();
        } catch (e) {
            logError(label + " tick failed: " + e);
        }
    }
    export function OnGameModeEnded(): void {
        running = false;
        log("Game mode ended");
        if (ENABLE_WIN_CONDITION_LOGS) {
            const t1 = getTickets(1);
            const t2 = getTickets(2);
            const o1 = Objective_GetOwnedCount(1);
            const o2 = Objective_GetOwnedCount(2);
            log(`[WinCondition] gameModeEnded t1=${t1} t2=${t2} o1=${o1} o2=${o2}`);
        }
    }
    export function OnPlayerJoinGame(player: mod.Player): void {
        try {
            const team = mod.GetTeam(player);
            const teamId = mod.GetObjId(team);
            logDebug("Player connected to team " + teamId);
        } catch (e) {
        }
    }
    export function OnPlayerDeployed(player: mod.Player): void {
        if (!player) return;
        const isAI = isAISoldier(player);
        const teamId = getPlayerTeamId(player);
        const playerId = mod.GetObjId(player);
        logDebug(`[Deployed] ${isAI ? "AI" : "Human"} team=${teamId} id=${playerId}`);
        if (!isAI) {
            safeCall("MarkDeployed", () => markPlayerDeployed(player));
            safeCall("VehicleUI:Deployed", () => vehicleUI_OnPlayerDeployed(player));
            safeCall("SkipManDown", () => mod.SkipManDown(player, false));
            safeCall("VehicleUI:Hide", () => onPlayerDeployedHideVehicleUI(player));
            safeCall("SpawnRecycle:OnHumanDeployed", () => SpawnRecycle_OnHumanDeployed(player));
            return;
        }
        safeCall("MarkDeployed", () => markPlayerDeployed(player));
        safeCall("VehicleUI:Deployed", () => vehicleUI_OnPlayerDeployed(player));
        safeCall("SkipManDown", () => mod.SkipManDown(player, false));
        safeCall("SpawnRecycle:OnPlayerDeployed", () => SpawnRecycle_OnPlayerDeployed(player));
        safeCall("AILoadout", () => equipAILoadout(player));
        if (FlightRecorder_ShouldKeepIdle() && isAISoldier(player)) {
            safeCall("AIIdle", () => mod.AIIdleBehavior(player));
        } else {
            safeCall("AIBattlefield", () => mod.AIBattlefieldBehavior(player));
        }
    }
    export function OnPlayerUndeploy(player: mod.Player): void {
        if (!player) return;
        safeCall("MarkUndeployed", () => markPlayerUndeployed(player));
        safeCall("VehicleUI:Undeployed", () => vehicleUI_OnPlayerUndeployed(player));
        safeCall("Zipline:Undeploy", () => Zipline_OnPlayerUndeploy(player));
    }
    export function OnPlayerUIButtonEvent(
        eventPlayer: mod.Player,
        eventUIWidget: mod.UIWidget,
        eventUIButtonEvent: mod.UIButtonEvent
    ): void {
        if (!eventPlayer || !eventUIWidget) return;
        safeCall("VehicleUI:ButtonPress", () => {
            vehicleUI_HandleButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
        });
    }
    export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
        if (!player || !spawner) return;
        safeCall("MarkDeployed", () => markPlayerDeployed(player));
        safeCall("SpawnRecycle:OnSpawnerSpawned", () => SpawnRecycle_OnSpawnerSpawned(player, spawner));
    }
    const captureRewardsGiven = new Set<number>(); // spawnerObjIds already triggered
    interface PendingAutoSpawnDisable {
        spawnerObjId: number;
        vehicleName: string;
        label: string;
        enabledAt: number;
    }
    const pendingAutoSpawnDisables: PendingAutoSpawnDisable[] = [];
    function tickCaptureRewardSpawns(): void {
        if (pendingAutoSpawnDisables.length === 0) return;
        const t = mod.GetMatchTimeElapsed();
        for (let i = pendingAutoSpawnDisables.length - 1; i >= 0; i--) {
            const pending = pendingAutoSpawnDisables[i];
            if (t - pending.enabledAt < 30.0) continue;
            pendingAutoSpawnDisables.splice(i, 1);
            try {
                const spawner = mod.GetVehicleSpawner(pending.spawnerObjId);
                mod.SetVehicleSpawnerAutoSpawn(spawner, false);
                log(`[CaptureReward] AutoSpawn disabled for ${pending.vehicleName} at ${pending.label} (one-shot complete)`);
            } catch (e) {
                log(`[CaptureReward] ERROR disabling AutoSpawn for ${pending.spawnerObjId}: ${e}`);
            }
        }
    }
    const REWARD_VEHICLE_POOL = [
        mod.VehicleList.Abrams,
        mod.VehicleList.Leopard,
        mod.VehicleList.M2Bradley,
        mod.VehicleList.CV90,
        mod.VehicleList.Cheetah,
        mod.VehicleList.Gepard,
        mod.VehicleList.Marauder,
        mod.VehicleList.Marauder_Pax,
        mod.VehicleList.Vector,
        mod.VehicleList.Flyer60,
        mod.VehicleList.Quadbike,
        mod.VehicleList.GolfCart,
        mod.VehicleList.AH64,
        mod.VehicleList.Eurocopter,
        mod.VehicleList.AH6M,
        mod.VehicleList.UH60,
        mod.VehicleList.UH60_Pax,
    ];
    const REWARD_VEHICLE_NAMES: Record<number, string> = {
        [mod.VehicleList.Abrams]: "Abrams",
        [mod.VehicleList.Leopard]: "Leopard",
        [mod.VehicleList.M2Bradley]: "Bradley",
        [mod.VehicleList.CV90]: "CV90",
        [mod.VehicleList.Cheetah]: "Cheetah AA",
        [mod.VehicleList.Gepard]: "Gepard AA",
        [mod.VehicleList.Marauder]: "Marauder",
        [mod.VehicleList.Marauder_Pax]: "Marauder Pax",
        [mod.VehicleList.Vector]: "Vector",
        [mod.VehicleList.Flyer60]: "Flyer",
        [mod.VehicleList.Quadbike]: "Quadbike",
        [mod.VehicleList.GolfCart]: "Golf Cart",
        [mod.VehicleList.AH64]: "AH64 Apache",
        [mod.VehicleList.Eurocopter]: "Eurocopter",
        [mod.VehicleList.AH6M]: "Little Bird",
        [mod.VehicleList.UH60]: "Black Hawk",
        [mod.VehicleList.UH60_Pax]: "Black Hawk Pax",
    };
    export function OnCapturePointCaptured(cp: mod.CapturePoint): void {
        const newOwnerTeam = mod.GetCurrentOwnerTeam(cp);
        const newOwnerTeamId = newOwnerTeam ? mod.GetObjId(newOwnerTeam) : 0;
        const previousOwnerTeamId = newOwnerTeamId === 1 ? 2 : (newOwnerTeamId === 2 ? 1 : 0);
        CapturePoint_OnCaptured(cp);
        safeCall("Sounds:Captured", () => Sounds_onCapturePointCaptured(cp, previousOwnerTeamId));
        safeCall("HUD:Captured", () => Hud_OnCapturePointCaptured(cp));
        safeCall("CaptureReward", () => {
            const cpObjId = mod.GetObjId(cp);
            for (const reward of CAPTURE_REWARDS) {
                if (reward.capturePointObjId === cpObjId && !captureRewardsGiven.has(reward.spawnerObjId)) {
                    captureRewardsGiven.add(reward.spawnerObjId);
                    const spawnerObjId = reward.spawnerObjId;
                    const pick = REWARD_VEHICLE_POOL[Math.floor(Math.random() * REWARD_VEHICLE_POOL.length)];
                    const vehicleName = REWARD_VEHICLE_NAMES[pick] ?? "Unknown";
                    log(`[CaptureReward] LOTTERY: ${vehicleName} selected for ${reward.label} (spawner ${spawnerObjId}) on first capture of CP ${cpObjId}`);
                    try {
                        const spawner = mod.GetVehicleSpawner(spawnerObjId);
                        mod.SetVehicleSpawnerVehicleType(spawner, pick);
                        mod.SetVehicleSpawnerAutoSpawn(spawner, true);
                        log(`[CaptureReward] AutoSpawn ENABLED for spawner ${spawnerObjId} - engine will spawn ${vehicleName}`);
                    } catch (e) {
                        log(`[CaptureReward] ERROR: ${e}`);
                    }
                    pendingAutoSpawnDisables.push({
                        spawnerObjId,
                        vehicleName,
                        label: reward.label,
                        enabledAt: mod.GetMatchTimeElapsed(),
                    });
                }
            }
        });
    }
    export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerEnterCapturePoint(player, cp);
        } catch (e) {
        }
    }
    export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
        try {
            Sounds_onPlayerExitCapturePoint(player);
        } catch (e) {
        }
    }
    export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
        SpawnRecycle_OnBotDied(player);
        let skipTicketDeduction = false;
        if (!killer && isAISoldier(player)) {
            try {
                const isNonCombat =
                    mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Deserting) ||
                    mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Drowning) ||
                    mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Fall);
                if (isNonCombat) {
                    const inVehicle = mod.GetSoldierState(player, mod.SoldierStateBool.IsInVehicle);
                    if (!inVehicle) {
                        skipTicketDeduction = true;
                        log("[Ticket] Skipped deduction - non-combat AI death (stuck/expired on foot)");
                    }
                }
            } catch (_e) { /* player invalid, fall through to normal deduction */ }
        }
        if (!skipTicketDeduction) {
            Ticket_OnPlayerDied(player);
        }
        Scoreboard_recordDeath(player);
        Sounds_onPlayerDied(player);
        safeCall("FlightRecorder:Death", () => FlightRecorder_OnPlayerDied(player));
        if (killer) {
            Scoreboard_recordKill(killer, player);
        }
        const isAI = isAISoldier(player);
        if (isAI && mod.IsPlayerValid(player)) {
            try {
                const botId = mod.GetObjId(player);
                const teamId = getPlayerTeamId(player);
                const killerId = (killer && mod.IsPlayerValid(killer)) ? mod.GetObjId(killer) : 0;
                const weaponId = "n/a"; // WeaponUnlock is not a valid Object type for GetObjId
                let deathTypeName = "Unknown";
                try {
                    if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Deserting))       deathTypeName = "Deserting";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Drowning))   deathTypeName = "Drowning";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Explosion))  deathTypeName = "Explosion";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Fall))       deathTypeName = "Fall";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Fire))       deathTypeName = "Fire";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Headshot))   deathTypeName = "Headshot";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Melee))      deathTypeName = "Melee";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Penetration))deathTypeName = "Penetration";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Redeploy))   deathTypeName = "Redeploy";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Roadkill))   deathTypeName = "Roadkill";
                    else if (mod.EventDeathTypeCompare(deathType, mod.PlayerDeathTypes.Weapon))     deathTypeName = "Weapon";
                } catch (e) { /* ignore */ }
                log(`[Death] Bot ${botId} T${teamId} | type=${deathTypeName} | killer=${killerId} | weapon=${weaponId}`);
            } catch (_e) { /* ignore - purely diagnostic logging */ }
        }
        if (!isAI) {
            safeCall("VehicleUI:Death", () => onPlayerDiedShowUI(player));
        }
    }
    export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
        safeCall("SpawnRecycle:Mandown", () => SpawnRecycle_OnBotMandown(eventPlayer));
    }
    export function OnRevived(revived: mod.Player, reviver: mod.Player): void {
        Ticket_OnPlayerRevived(revived);
        Scoreboard_recordRevive(reviver);
    }
    export function OnPlayerEarnedKillAssist(player: mod.Player, victim: mod.Player): void {
        if (!player) return;
        safeCall("Scoreboard:Assist", () => Scoreboard_recordAssist(player));
    }
    export function OnVehicleSpawned(vehicle: mod.Vehicle): void {
        if (vehicleUIEnabled) safeCall("VehicleUI:VehicleSpawned", () => vehicleUI_OnVehicleSpawned(vehicle));
        safeCall("VehicleDirector:OnVehicleSpawned", () => VehicleDirector_OnVehicleSpawned(vehicle));
    }
    export function OnVehicleDestroyed(vehicle: mod.Vehicle, destroyer: mod.Player, weapon: mod.WeaponUnlock): void {
        if (destroyer) {
            Scoreboard_recordVehicleKill(destroyer, vehicle);
        }
        if (vehicleUIEnabled) safeCall("VehicleUI:VehicleDestroyed", () => vehicleUI_OnVehicleDestroyed(vehicle));
    }
    export function OnPlayerEnterVehicle(player: mod.Player, vehicle: mod.Vehicle): void {
        log(`[VehicleEvent] OnPlayerEnterVehicle fired - isAI: ${isAISoldier(player)}`);
        if (vehicleUIEnabled) safeCall("VehicleUI:EnterVehicle", () => vehicleUI_OnPlayerEnterVehicle(player, vehicle));
        safeCall("FlightRecorder:Enter", () => FlightRecorder_OnEnterVehicle(player));
        const rs = Registry_GetRoundState();
        if (rs === RoundState.PreRound && isAISoldier(player)) {
            try { mod.ForcePlayerExitVehicle(player); } catch (_) {}
        }
    }
    export function OnPlayerExitVehicle(player: mod.Player, vehicle: mod.Vehicle): void {
        if (vehicleUIEnabled) safeCall("VehicleUI:ExitVehicle", () => vehicleUI_OnPlayerExitVehicle(player, vehicle));
        safeCall("FlightRecorder:Exit", () => FlightRecorder_OnExitVehicle(player));
    }
    export function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint): void {
        safeCall("Zipline:Interact", () => Zipline_OnPlayerInteract(player, interactPoint));
    }
    export function OnPlayerEnterAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
        safeCall("Zipline:EnterTrigger", () => Zipline_OnPlayerEnterAreaTrigger(player, areaTrigger));
    }
    export function OnPlayerExitAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
        safeCall("Zipline:ExitTrigger", () => Zipline_OnPlayerExitAreaTrigger(player, areaTrigger));
    }
    export function OnPlayerLeaveGame(player: mod.Player): void {
    }
}


// Global Portal Event Handlers
export function OnGameModeStarted(): void {
    console.log("[ConquestV14] OnGameModeStarted");
    ConquestV8.OnGameModeStarted();
}

export function OnGameModeEnded(): void {
    console.log("[ConquestV14] OnGameModeEnded");
    ConquestV8.OnGameModeEnded();
}

export function OnPlayerJoinGame(player: mod.Player): void {
    ConquestV8.OnPlayerJoinGame(player);
}

export function OnPlayerDeployed(player: mod.Player): void {
    ConquestV8.OnPlayerDeployed(player);
}

export function OnPlayerUndeploy(player: mod.Player): void {
    ConquestV8.OnPlayerUndeploy(player);
}

export function OnSpawnerSpawned(player: mod.Player, spawner: mod.Spawner): void {
    ConquestV8.OnSpawnerSpawned(player, spawner);
}

export function OnPlayerUIButtonEvent(eventPlayer: mod.Player, eventUIWidget: mod.UIWidget, eventUIButtonEvent: mod.UIButtonEvent): void {
    ConquestV8.OnPlayerUIButtonEvent(eventPlayer, eventUIWidget, eventUIButtonEvent);
}

export function OnPlayerEnterCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
    ConquestV8.OnPlayerEnterCapturePoint(player, cp);
}

export function OnPlayerExitCapturePoint(player: mod.Player, cp: mod.CapturePoint): void {
    ConquestV8.OnPlayerExitCapturePoint(player, cp);
}

export function OnCapturePointCaptured(cp: mod.CapturePoint): void {
    ConquestV8.OnCapturePointCaptured(cp);
}

export function OnPlayerDied(player: mod.Player, killer: mod.Player, deathType: mod.DeathType, weapon: mod.WeaponUnlock): void {
    ConquestV8.OnPlayerDied(player, killer, deathType, weapon);
}

export function OnRevived(revived: mod.Player, reviver: mod.Player): void {
    ConquestV8.OnRevived(revived, reviver);
}

export function OnVehicleSpawned(vehicle: mod.Vehicle): void {
    ConquestV8.OnVehicleSpawned(vehicle);
}

export function OnVehicleDestroyed(vehicle: mod.Vehicle, destroyer: mod.Player, weapon: mod.WeaponUnlock): void {
    ConquestV8.OnVehicleDestroyed(vehicle, destroyer, weapon);
}

export function OnMandown(eventPlayer: mod.Player, eventOtherPlayer: mod.Player): void {
    ConquestV8.OnMandown(eventPlayer, eventOtherPlayer);
}

// V13: Kill assist tracking
export function OnPlayerEarnedKillAssist(player: mod.Player, victim: mod.Player): void {
    ConquestV8.OnPlayerEarnedKillAssist(player, victim);
}

// Zipline Event Handlers
export function OnPlayerInteract(player: mod.Player, interactPoint: mod.InteractPoint): void {
    ConquestV8.OnPlayerInteract(player, interactPoint);
}

export function OnPlayerEnterAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    ConquestV8.OnPlayerEnterAreaTrigger(player, areaTrigger);
}

export function OnPlayerExitAreaTrigger(player: mod.Player, areaTrigger: mod.AreaTrigger): void {
    ConquestV8.OnPlayerExitAreaTrigger(player, areaTrigger);
}

export function OnPlayerLeaveGame(player: mod.Player): void {
    ConquestV8.OnPlayerLeaveGame(player);
}

