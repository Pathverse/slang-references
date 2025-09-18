/// Generated file. Do not edit.
///
/// Locales: 1
/// Strings: 10
///
/// Built on 2024-01-01 at 12:00 UTC

// coverage:ignore-file
// ignore_for_file: type=lint

import 'package:flutter/widgets.dart';
import 'package:slang/builder/model/node.dart';
import 'package:slang_flutter/slang_flutter.dart';

const AppLocale _baseLocale = AppLocale.en;

/// Supported locales, see extension methods below.
///
/// Usage:
/// - LocaleSettings.setLocale(AppLocale.en) // set locale
/// - Locale locale = AppLocale.en.flutterLocale // get flutter locale from enum
/// - if (LocaleSettings.currentLocale == AppLocale.en) // locale check
enum AppLocale with BaseAppLocale<AppLocale, _StringsEn> {
	en(languageCode: 'en', build: _StringsEn.build);

	const AppLocale({
		required this.languageCode,
		this.scriptCode,
		this.countryCode,
		required this.build,
	});

	@override final String languageCode;
	@override final String? scriptCode;
	@override final String? countryCode;
	@override final TranslationBuilder<AppLocale, _StringsEn> build;

	/// Gets current instance managed by [LocaleSettings].
	_StringsEn get translations => LocaleSettings.instance.translationMap[this]!;
}

/// Method A: Simple
///
/// No rebuild after locale change.
/// Translation happens during initialization of the widget (call of t).
/// Configurable via 'translate_var'.
_StringsEn get t => LocaleSettings.instance.currentTranslations;

/// Method B: Advanced
///
/// All widgets using this method will trigger a rebuild when locale changes.
/// Use this if you have e.g. a settings page where the user can select the locale during runtime.
///
/// Step 1: wrap your App with
/// TranslationProvider(
/// 	child: MyApp()
/// )
///
/// Step 2: use 
/// String a = context.t.someKey.anotherKey;
/// String b = t.someKey.anotherKey; // static alternative
extension BuildContextTranslationsExtension on BuildContext {
	_StringsEn get t => TranslationProvider.of(this).translations;
}

/// The provider for method B
class TranslationProvider extends BaseTranslationProvider<AppLocale, _StringsEn> {
	TranslationProvider({required super.child}) : super(settings: LocaleSettings.instance);

	static InheritedLocaleData<AppLocale, _StringsEn> of(BuildContext context) => InheritedLocaleData.of<AppLocale, _StringsEn>(context);
}

/// Method C: Raw
///
/// Provides access to the raw translation map.
/// In this case, you must manage the locale yourself.
/// Only for advanced users.
class AppLocaleUtils extends BaseAppLocaleUtils<AppLocale, _StringsEn> {
	AppLocaleUtils._() : super(baseLocale: _baseLocale, locales: AppLocale.values);
}

extension AppLocaleExtensions on AppLocale {
	/// Gets the translation instance managed by [LocaleSettings].
	/// Does not trigger a rebuild.
	_StringsEn get translations => LocaleSettings.instance.translationMap[this]!;

	/// Gets the translation instance managed by [LocaleSettings].
	/// Triggers a rebuild of the calling widget.
	_StringsEn get tr => TranslationProvider.of(TranslationProvider._context!).translations;
}

class LocaleSettings extends BaseFlutterLocaleSettings<AppLocale, _StringsEn> {
	LocaleSettings._() : super(utils: AppLocaleUtils._());

	static final instance = LocaleSettings._();

	// static aliases (checkout base methods for documentation)
	static AppLocale get currentLocale => instance.currentLocale;
	static Stream<AppLocale> getLocaleStream() => instance.getLocaleStream();
	static AppLocale setLocale(AppLocale locale, {bool? listenToDeviceLocale = false}) => instance.setLocale(locale, listenToDeviceLocale: listenToDeviceLocale);
	static AppLocale setLocaleRaw(String rawLocale, {bool? listenToDeviceLocale = false}) => instance.setLocaleRaw(rawLocale, listenToDeviceLocale: listenToDeviceLocale);
	static AppLocale useDeviceLocale() => instance.useDeviceLocale();
	@Deprecated('Use [AppLocaleUtils.supportedLocales]') static List<Locale> get supportedLocales => instance.supportedLocales;
	@Deprecated('Use [AppLocaleUtils.supportedLocalesRaw]') static List<String> get supportedLocalesRaw => instance.supportedLocalesRaw;
	static void setPluralResolver({String? language, AppLocale? locale, PluralResolver? cardinalResolver, PluralResolver? ordinalResolver}) => instance.setPluralResolver(
		language: language,
		locale: locale,
		cardinalResolver: cardinalResolver,
		ordinalResolver: ordinalResolver,
	);
}

// translations

// Path: <root>
class _StringsEn implements BaseTranslations<AppLocale, _StringsEn> {

	/// You can call this constructor and build your own translation instance of this locale.
	/// Constructing via the enum [AppLocale.en] is preferred.
	_StringsEn.build({Map<String, Node>? overrides, PluralResolver? cardinalResolver, PluralResolver? ordinalResolver})
		: assert(overrides == null, 'Set "translation_overrides: true" in order to enable this feature.'),
		  $meta = TranslationMetadata(
		    locale: AppLocale.en,
		    overrides: overrides ?? {},
		    cardinalResolver: cardinalResolver,
		    ordinalResolver: ordinalResolver,
		  ) {
		$meta.setFlatMapFunction(_flatMapFunction);
	}

	/// Metadata for the translations of <en>.
	@override final TranslationMetadata<AppLocale, _StringsEn> $meta;

	/// Access flat map
	dynamic operator[](String key) => $meta.getTranslation(key);

	late final _StringsEn _root = this; // ignore: unused_field

	// Translations
	/// en: 'Contact & Feedback'
	String get contactAndFeedback => 'Contact & Feedback';
	/// en: 'Welcome to our app!'
	String get welcome => 'Welcome to our app!';
	late final _StringsSettingsEn settings = _StringsSettingsEn._(_root);
	late final _StringsButtonsEn buttons = _StringsButtonsEn._(_root);
	late final _StringsErrorsEn errors = _StringsErrorsEn._(_root);
}

// Path: settings
class _StringsSettingsEn {
	_StringsSettingsEn._(this._root);

	final _StringsEn _root; // ignore: unused_field

	// Translations
	/// en: 'Settings'
	String get title => 'Settings';
	/// en: 'Language'
	String get language => 'Language';
	/// en: 'Theme'
	String get theme => 'Theme';
}

// Path: buttons
class _StringsButtonsEn {
	_StringsButtonsEn._(this._root);

	final _StringsEn _root; // ignore: unused_field

	// Translations
	/// en: 'Save'
	String get save => 'Save';
	/// en: 'Cancel'
	String get cancel => 'Cancel';
	/// en: 'Delete'
	String get delete => 'Delete';
	/// en: 'Confirm'
	String get confirm => 'Confirm';
}

// Path: errors
class _StringsErrorsEn {
	_StringsErrorsEn._(this._root);

	final _StringsEn _root; // ignore: unused_field

	// Translations
	/// en: 'Network connection failed'
	String get networkError => 'Network connection failed';
	/// en: 'Please enter a valid email address'
	String get invalidEmail => 'Please enter a valid email address';
	/// en: 'This field is required'
	String get required => 'This field is required';
}

/// Flat map(s) containing all translations.
/// Only for edge cases! For simple maps, use the map function of this library.

extension on _StringsEn {
	dynamic _flatMapFunction(String path) {
		switch (path) {
			case 'contactAndFeedback': return 'Contact & Feedback';
			case 'welcome': return 'Welcome to our app!';
			case 'settings.title': return 'Settings';
			case 'settings.language': return 'Language';
			case 'settings.theme': return 'Theme';
			case 'buttons.save': return 'Save';
			case 'buttons.cancel': return 'Cancel';
			case 'buttons.delete': return 'Delete';
			case 'buttons.confirm': return 'Confirm';
			case 'errors.networkError': return 'Network connection failed';
			case 'errors.invalidEmail': return 'Please enter a valid email address';
			case 'errors.required': return 'This field is required';
			default: return null;
		}
	}
}