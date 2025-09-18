import 'package:flutter/material.dart';
import 'i18n/strings.g.dart';

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text(
              t.welcome, // Test hover here
            ),
            Text(
              t.contactAndFeedback, // Test hover here
            ),
            Text(
              t.settings.title, // Test hover here
            ),
            Text(
              t.buttons.save, // Test hover here
            ),
            Text(
              t.errors.networkError, // Test hover here
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: t.buttons.confirm, // Test hover here
        child: const Icon(Icons.add),
      ),
    );
  }
}